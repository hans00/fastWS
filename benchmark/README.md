# Tested

- Express + ws
- this project


# Enviroments

VM Host:
```
CPU: E5-2630 v3
RAM: 64GB
OS: Proxmox VE
```

## Server

```
CPU: KVM 2 Core
RAM: 2GB
OS: Debian 10
Node: 12
```

## Client

```
CPU: KVM 4 Core
RAM: 4GB
OS: Debian 10
```

# Results

## Static file

```sh
wrk -c 1k -t 100 -d 10s http://$IP:3000
```

### Express

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   308.55ms   52.36ms   1.32s    97.93%
    Req/Sec    32.47     19.67    90.00     65.74%
  30739 requests in 10.09s, 8.91MB read
Requests/sec:   3045.88
Transfer/sec:      0.88MB
```

### This Project

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    55.56ms   23.64ms 567.85ms   98.52%
    Req/Sec   185.09     50.12   690.00     74.66%
  178289 requests in 10.10s, 29.59MB read
Requests/sec:  17652.41
Transfer/sec:      2.93MB
```

## Dynamic with URL parameter

```sh
wrk -c 1k -t 100 -d 10s http://$IP:3000/hello/test
```

### Express

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   113.96ms  175.15ms   1.99s    96.52%
    Req/Sec   115.81     41.47   303.00     78.35%
  105699 requests in 10.09s, 13.41MB read
Requests/sec:  10479.06
Transfer/sec:      1.33MB
```

### This Project

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   113.96ms  175.15ms   1.99s    96.52%
    Req/Sec   115.81     41.47   303.00     78.35%
  105699 requests in 10.09s, 13.41MB read
Requests/sec:  10479.06
Transfer/sec:      1.33MB
```

## WS

[Tool](https://github.com/hashrocket/websocket-shootout)

```sh
# build
make bin/websocket-bench
# test
bin/websocket-bench echo ws://$IP:3000/ws \
  --concurrent 5000 \
  --sample-size 100 \
  --step-size 1000 \
  --limit-percentile 95 \
  --limit-rtt 500ms
```

### Express

```
clients:  1000    95per-rtt:  24ms    min-rtt:   2ms    median-rtt:  13ms    max-rtt:  26ms
clients:  2000    95per-rtt:  84ms    min-rtt:  26ms    median-rtt:  59ms    max-rtt:  86ms
clients:  3000    95per-rtt:  94ms    min-rtt:  63ms    median-rtt:  88ms    max-rtt:  95ms
clients:  4000    95per-rtt: 134ms    min-rtt:  93ms    median-rtt: 117ms    max-rtt: 135ms
clients:  5000    95per-rtt: 165ms    min-rtt: 136ms    median-rtt: 154ms    max-rtt: 168ms
clients:  6000    95per-rtt: 188ms    min-rtt: 168ms    median-rtt: 180ms    max-rtt: 189ms
clients:  7000    95per-rtt: 206ms    min-rtt: 189ms    median-rtt: 198ms    max-rtt: 206ms
clients:  8000    95per-rtt: 218ms    min-rtt: 207ms    median-rtt: 214ms    max-rtt: 218ms
clients:  9000    95per-rtt: 224ms    min-rtt: 218ms    median-rtt: 222ms    max-rtt: 224ms
clients: 10000    95per-rtt: 236ms    min-rtt: 223ms    median-rtt: 225ms    max-rtt: 236ms
clients: 11000    95per-rtt: 235ms    min-rtt:   6ms    median-rtt: 229ms    max-rtt: 235ms
clients: 12000    95per-rtt:  10ms    min-rtt:   6ms    median-rtt:   8ms    max-rtt:  10ms
clients: 13000    95per-rtt:  21ms    min-rtt:   6ms    median-rtt:  10ms    max-rtt:  22ms
clients: 14000    95per-rtt:  21ms    min-rtt:  16ms    median-rtt:  17ms    max-rtt:  22ms
clients: 15000    95per-rtt:  27ms    min-rtt:  18ms    median-rtt:  24ms    max-rtt:  27ms
clients: 16000    95per-rtt:  56ms    min-rtt:  24ms    median-rtt:  28ms    max-rtt:  57ms
```

`RPS: 10000 req/0.23s = 43478.2609 req/s`

### This Project

```
clients:  1000    95per-rtt:   4ms    min-rtt:   1ms    median-rtt:   3ms    max-rtt:   5ms
clients:  2000    95per-rtt:   7ms    min-rtt:   5ms    median-rtt:   5ms    max-rtt:   7ms
clients:  3000    95per-rtt:   9ms    min-rtt:   7ms    median-rtt:   8ms    max-rtt:   9ms
clients:  4000    95per-rtt:  12ms    min-rtt:   9ms    median-rtt:   9ms    max-rtt:  12ms
clients:  5000    95per-rtt:  16ms    min-rtt:  12ms    median-rtt:  15ms    max-rtt:  16ms
clients:  6000    95per-rtt:  16ms    min-rtt:  16ms    median-rtt:  16ms    max-rtt:  16ms
clients:  7000    95per-rtt:  21ms    min-rtt:  16ms    median-rtt:  20ms    max-rtt:  21ms
clients:  8000    95per-rtt:  22ms    min-rtt:  21ms    median-rtt:  21ms    max-rtt:  22ms
clients:  9000    95per-rtt:  30ms    min-rtt:  20ms    median-rtt:  28ms    max-rtt:  30ms
clients: 10000    95per-rtt: 100ms    min-rtt:  25ms    median-rtt:  34ms    max-rtt: 102ms
clients: 11000    95per-rtt: 100ms    min-rtt:   0ms    median-rtt:  56ms    max-rtt: 102ms
clients: 12000    95per-rtt:   9ms    min-rtt:   0ms    median-rtt:   6ms    max-rtt:  10ms
clients: 13000    95per-rtt:   8ms    min-rtt:   2ms    median-rtt:   4ms    max-rtt:   8ms
clients: 14000    95per-rtt:   2ms    min-rtt:   1ms    median-rtt:   1ms    max-rtt:   2ms
clients: 15000    95per-rtt:   2ms    min-rtt:   0ms    median-rtt:   1ms    max-rtt:   2ms
clients: 16000    95per-rtt:   1ms    min-rtt:   0ms    median-rtt:   0ms    max-rtt:   1ms
clients: 17000    95per-rtt:   0ms    min-rtt:   0ms    median-rtt:   0ms    max-rtt:   0ms
clients: 18000    95per-rtt:   0ms    min-rtt:   0ms    median-rtt:   0ms    max-rtt:   1ms
clients: 19000    95per-rtt:   0ms    min-rtt:   0ms    median-rtt:   0ms    max-rtt:   0ms
clients: 20000    95per-rtt:   0ms    min-rtt:   0ms    median-rtt:   0ms    max-rtt:   0ms
```

`RPS: 10000 req/0.05s = 200000 req/s`
