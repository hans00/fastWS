Tested
---

- Express + ws
- this project


Enviroments
---

VM Host:
```
CPU: E5-2630 v3
RAM: 64GB
OS: Proxmox VE
```

# Server

```
CPU: KVM 2 Core
RAM: 2GB
OS: Debian 10
Node: 12
```

# Client

```
CPU: KVM 4 Core
RAM: 4GB
OS: Debian 10
```

Results
---

# Static file

```sh
wrk -c 1k -t 10 -d 10s http://<IP>:3000
```

## Express

```
Running 10s test @ http://<IP>:3000
  10 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   309.14ms   84.79ms   1.23s    89.22%
    Req/Sec   323.84    173.86     1.00k    71.07%
  31366 requests in 10.03s, 9.09MB read
Requests/sec:   3127.35
Transfer/sec:      0.91MB
```

## This Project

```
Running 10s test @ http://172.17.210.1:3000
  10 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    54.04ms   52.45ms   1.08s    98.46%
    Req/Sec     1.89k   551.05     3.73k    77.86%
  76083 requests in 10.06s, 12.63MB read
Requests/sec:   7565.18
Transfer/sec:      1.26MB
```

# Dynamic with URL parameter

```sh
wrk -c 1k -t 10 -d 10s http://<IP>:3000/param/test
```

## Express

```
Running 10s test @ http://<IP>:3000/param/test
  10 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   102.97ms  101.94ms   1.35s    97.42%
    Req/Sec     1.07k   275.90     2.66k    83.28%
  99698 requests in 10.08s, 11.98MB read
  Socket errors: connect 0, read 0, write 0, timeout 98
Requests/sec:   9893.80
Transfer/sec:      1.19MB
```

## This Project

```
Running 10s test @ http://<IP>:3000/param/test
  10 threads and 1000 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    25.17ms   12.54ms 493.42ms   99.29%
    Req/Sec     4.00k   616.40     5.94k    90.58%
  397847 requests in 10.03s, 23.52MB read
Requests/sec:  39675.91
Transfer/sec:      2.35MB
```

# WS

```sh
thor -M 500 -A 1000 -W 4 -B 1024 ws://<IP>:3000/ws
```

## Express

```
WIP
```

## This Project

```
WIP
```
