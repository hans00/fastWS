# Tested

- Express + ws
- this project


# Enviroments

## VM Host

```
CPU: E5-2630 v3
RAM: 64GB
OS: Proxmox VE
```

## Server

```
CPU: KVM 2 Core
RAM: 2GB
OS: Ubuntu 18.04
Node: 12
```

```sh
sysctl -w fs.file-max=20480000
ulimit -n 655350
```

## Client

```
CPU: KVM 4 Core
RAM: 4GB
OS: Ubuntu 18.04
Node: 12
```

```sh
sysctl -w fs.file-max=20480000
ulimit -n 655350
```

# Results

## Static file without cache

```sh
wrk -c 1k -t 100 -d 10s http://$IP:3000
```

### Express

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   280.01ms   94.83ms   1.31s    91.82%
    Req/Sec    38.75     20.75   101.00     72.29%
  32843 requests in 10.10s, 9.24MB read
  Socket errors: connect 0, read 0, write 0, timeout 130
Requests/sec:   3252.02
Transfer/sec:      0.91MB
```

### This Project

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    86.13ms   34.09ms 632.83ms   89.54%
    Req/Sec   118.77     42.40   600.00     81.31%
  104337 requests in 10.10s, 16.42MB read
Requests/sec:  10333.78
Transfer/sec:      1.63MB
```

## Dynamic with URL parameter

```sh
wrk -c 1k -t 100 -d 10s http://$IP:3000/hello/test
```

### Express

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    87.72ms   99.11ms   1.85s    97.68%
    Req/Sec   131.10     48.22   303.00     70.25%
  120955 requests in 10.09s, 15.34MB read
Requests/sec:  11988.87
Transfer/sec:      1.52MB
```

### This Project

```
  100 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    30.22ms    8.52ms 281.30ms   88.96%
    Req/Sec   333.22     74.28     0.98k    92.10%
  309799 requests in 10.09s, 20.39MB read
Requests/sec:  30702.58
Transfer/sec:      2.02MB
```

## WS Echo

[Tool](https://github.com/hashrocket/websocket-shootout)

```sh
./bench-ws.js --duration 10 --ramp-up 100 --counts 10000 --threads 2 --timeout 3000 ws://$IP:3000/echo
```

### Express

```
Start 2 threads, duration 10s

Connection Latency:
  Max: 1153 ms
  Min: 57 ms
  Mean: 150.50112233445566 ms
  Median: 111 ms
  StdDev: 151.9884540954143 ms

Echo Latency:
  Max: 188 ms
  Min: 4 ms
  Mean: 44.25972448708064 ms
  Median: 38 ms
  StdDev: 26.260567959469494 ms

Connection/sec: 178.2
Echo/sec: 14656.3
Transfer/sec: 14.31279296875 MB
```

### This Project

```
Start 2 threads, duration 10s

Connection Latency:
  Max: 1098 ms
  Min: 48 ms
  Mean: 125.8065 ms
  Median: 89 ms
  StdDev: 195.68531896325288 ms

Echo Latency:
  Max: 634 ms
  Min: 1 ms
  Mean: 32.28315897779702 ms
  Median: 27 ms
  StdDev: 34.445606107545444 ms

Connection/sec: 200
Echo/sec: 21479.1
Transfer/sec: 20.97568359375 MB
```

## WS fast-ws protocol

```sh
./bench-ws.js --duration 10 --ramp-up 100 --counts 10000 --threads 2 --timeout 3000 ws://$IP:3000/fws --module fast-ws
```

### Express

```
Start 2 threads, duration 10s

Connection Latency:
  Max: 3241 ms
  Min: 62 ms
  Mean: 330.38159675236807 ms
  Median: 168 ms
  StdDev: 452.0244963689611 ms

Echo Latency:
  Max: 226 ms
  Min: 10 ms
  Mean: 77.8398266151011 ms
  Median: 81 ms
  StdDev: 36.672611292554095 ms

Connection/sec: 147.8
Echo/sec: 11558.1
Transfer/sec: 11.28720703125 MB
```

### This Project

```
Start 2 threads, duration 10s

Connection Latency:
  Max: 1270 ms
  Min: 47 ms
  Mean: 189.4675 ms
  Median: 123.5 ms
  StdDev: 236.83729846405123 ms

Echo Latency:
  Max: 180 ms
  Min: 5 ms
  Mean: 53.999425789797684 ms
  Median: 52 ms
  StdDev: 28.105240456257427 ms

Connection/sec: 200
Echo/sec: 19330.9
Transfer/sec: 18.87783203125 MB
```

## Socket.IO

```sh
./bench-ws.js --duration 10 --ramp-up 100 --counts 10000 --threads 2 --timeout 3000 ws://$IP:3000 --module socket.io-client
```

### Node.js HTTP

```
Start 2 threads, duration 10s

Connection Latency:
  Max: 3888 ms
  Min: 22 ms
  Mean: 125.6859756097561 ms
  Median: 106 ms
  StdDev: 192.78425841110928 ms

Echo Latency:
  Max: 3289 ms
  Min: 1 ms
  Mean: 423.2697930675459 ms
  Median: 425 ms
  StdDev: 290.2451708722303 ms

Connection/sec: 196.8
Echo/sec: 2305.1
Transfer/sec: 2.25107421875 MB
```

### This Project

> N/A, Not implement.
