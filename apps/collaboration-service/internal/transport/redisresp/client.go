package redisresp

import (
	"bufio"
	"crypto/tls"
	"errors"
	"fmt"
	"net"
	"net/url"
	"strconv"
	"strings"
	"sync"
	"time"
)

type Client struct {
	conn net.Conn
	r    *bufio.Reader
	mu   sync.Mutex
}

func New(redisURL string) (*Client, error) {
	u, err := url.Parse(redisURL)
	if err != nil {
		return nil, err
	}
	host := u.Host
	if !strings.Contains(host, ":") {
		host += ":6379"
	}
	var c net.Conn
	if u.Scheme == "rediss" {
		c, err = tls.Dial("tcp", host, &tls.Config{MinVersion: tls.VersionTLS12})
	} else {
		c, err = net.Dial("tcp", host)
	}
	if err != nil {
		return nil, err
	}
	cli := &Client{conn: c, r: bufio.NewReader(c)}
	if pw, ok := u.User.Password(); ok && pw != "" {
		if _, err := cli.Do("AUTH", pw); err != nil {
			_ = c.Close()
			return nil, err
		}
	}
	if db := strings.TrimPrefix(u.Path, "/"); db != "" && db != "0" {
		if _, err := cli.Do("SELECT", db); err != nil {
			_ = c.Close()
			return nil, err
		}
	}
	return cli, nil
}

func (c *Client) Close() error { return c.conn.Close() }

func (c *Client) Do(args ...string) (any, error) {
	c.mu.Lock()
	defer c.mu.Unlock()
	_ = c.conn.SetDeadline(time.Now().Add(5 * time.Second))
	if _, err := fmt.Fprintf(c.conn, "*%d\r\n", len(args)); err != nil {
		return nil, err
	}
	for _, arg := range args {
		if _, err := fmt.Fprintf(c.conn, "$%d\r\n%s\r\n", len(arg), arg); err != nil {
			return nil, err
		}
	}
	return c.readReply()
}

func (c *Client) readReply() (any, error) {
	b, err := c.r.ReadByte()
	if err != nil {
		return nil, err
	}
	line, err := c.r.ReadString('\n')
	if err != nil {
		return nil, err
	}
	line = strings.TrimSuffix(strings.TrimSuffix(line, "\n"), "\r")
	switch b {
	case '+':
		return line, nil
	case '-':
		return nil, errors.New(line)
	case ':':
		return strconv.Atoi(line)
	case '$':
		n, _ := strconv.Atoi(line)
		if n == -1 {
			return nil, nil
		}
		buf := make([]byte, n+2)
		if _, err := c.r.Read(buf); err != nil {
			return nil, err
		}
		return string(buf[:n]), nil
	case '*':
		n, _ := strconv.Atoi(line)
		arr := make([]any, n)
		for i := 0; i < n; i++ {
			v, err := c.readReply()
			if err != nil {
				return nil, err
			}
			arr[i] = v
		}
		return arr, nil
	default:
		return nil, fmt.Errorf("unknown redis response")
	}
}
