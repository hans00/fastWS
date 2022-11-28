# Hardware Info

- CPU: Intel(R) Xeon(R) CPU E5-2630 v3 @ 2.40GHz
- Logical Cores: 8
- Memory: 9.719261169433594 GB

# Fast WS

```
STARTUP: 1.124ms
Listen on 3000
```

## Static file without cache

```
Running 10s test @ http://127.0.0.1:3000
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    18.42ms    3.22ms  71.08ms   94.53%
    Req/Sec   546.09    195.65     8.65k    96.45%
  108789 requests in 10.10s, 20.54MB read
Requests/sec:  10771.05
Transfer/sec:      2.03MB
```

## Dynamic with URL parameter

```
Running 10s test @ http://127.0.0.1:3000/hello/test
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     9.23ms    1.05ms  22.63ms   87.97%
    Req/Sec     1.09k   187.31     5.04k    96.61%
  217078 requests in 10.10s, 25.05MB read
Requests/sec:  21492.43
Transfer/sec:      2.48MB
```

## Get stream

```
Running 10s test @ http://127.0.0.1:3000/stream
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    14.88ms    2.27ms  46.47ms   95.39%
    Req/Sec   676.19     80.68   808.00     89.70%
  134675 requests in 10.01s, 1.30GB read
Requests/sec:  13447.46
Transfer/sec:    132.78MB
```

## POST stream pipe

```
Running 10s test @ http://127.0.0.1:3000/stream
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    42.77ms    8.66ms 139.75ms   89.62%
    Req/Sec   236.24     54.44   474.00     62.92%
  47130 requests in 10.10s, 4.68GB read
Requests/sec:   4667.14
Transfer/sec:    474.44MB
```

## POST large send

```
Running 10s test @ http://127.0.0.1:3000/stream/send
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   196.07ms   28.31ms 518.47ms   92.61%
    Req/Sec    53.38     19.10   101.00     78.01%
  10150 requests in 10.10s, 1.01GB read
Requests/sec:   1004.93
Transfer/sec:    102.18MB
```

## WS Echo

```
Start 4 threads, duration 10s

Connection Latency:
  Max: 947 ms
  Min: 46 ms
  Mean: 197.3355 ms
  Median: 79 ms
  StdDev: 285.81791483346535 ms

Echo Latency:
  Max: 102 ms
  Min: 1 ms
  Mean: 25.61048690552123 ms
  Median: 23 ms
  StdDev: 12.83386709688917 ms

Connection/sec: 400
Echo/sec: 52991.8
Transfer/sec: 51.7498046875 MB
```

## WS fast-ws protocol

```
Start 4 threads, duration 10s

Connection Latency:
  Max: 1845 ms
  Min: 63 ms
  Mean: 485.2991666666667 ms
  Median: 121 ms
  StdDev: 590.5662581129462 ms

Echo Latency:
  Max: 158 ms
  Min: 1 ms
  Mean: 74.61079807553011 ms
  Median: 77 ms
  StdDev: 36.07007371200989 ms

Connection/sec: 360
Echo/sec: 26230.6
Transfer/sec: 25.6158203125 MB
```

# nanoexpress

```
[Server]: started successfully at [localhost:3000] in [3ms]
```

## Static file without cache

```
Running 10s test @ http://127.0.0.1:3000
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     7.19ms  402.31us  15.40ms   95.87%
    Req/Sec     1.40k    55.89     1.51k    80.05%
  278102 requests in 10.01s, 42.17MB read
  Non-2xx or 3xx responses: 278102
Requests/sec:  27785.37
Transfer/sec:      4.21MB
```

## Dynamic with URL parameter

```
Running 10s test @ http://127.0.0.1:3000/hello/test
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     5.44ms  530.69us  19.80ms   97.99%
    Req/Sec     1.85k   332.77     9.40k    99.10%
  368276 requests in 10.10s, 23.18MB read
Requests/sec:  36464.06
Transfer/sec:      2.30MB
```

## Get stream

```
Unsupported
```

## POST stream pipe

```
Unsupported
```

## POST large send

```
Running 10s test @ http://127.0.0.1:3000/stream/send
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.13s   253.95ms   1.68s    88.96%
    Req/Sec    22.10     26.27   100.00     79.84%
  1667 requests in 10.10s, 508.13MB read
  Socket errors: connect 0, read 0, write 0, timeout 1
Requests/sec:    165.05
Transfer/sec:     50.31MB
```

## WS Echo

```
Start 4 threads, duration 10s

Connection Latency:
  Max: 143 ms
  Min: 58 ms
  Mean: 92.242 ms
  Median: 90 ms
  StdDev: 17.600438517264358 ms

Echo Latency:
  Max: 143 ms
  Min: 1 ms
  Mean: 27.853161790273706 ms
  Median: 25 ms
  StdDev: 15.449598480295206 ms

Connection/sec: 400
Echo/sec: 50327.5
Transfer/sec: 49.14794921875 MB
```

## WS fast-ws protocol

```
Start 4 threads, duration 10s

Connection Latency:
  Max: 1865 ms
  Min: 69 ms
  Mean: 697.47625 ms
  Median: 508 ms
  StdDev: 677.1512902859561 ms

Echo Latency:
  Max: 191 ms
  Min: 5 ms
  Mean: 76.81562746066004 ms
  Median: 74 ms
  StdDev: 36.257351192724165 ms

Connection/sec: 400
Echo/sec: 24510.7
Transfer/sec: 23.93623046875 MB
```

# express.js

```
STARTUP: 3.525ms
Listen on 3000
```

## Static file without cache

```
Running 10s test @ http://127.0.0.1:3000
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    71.75ms   14.67ms 207.30ms   90.49%
    Req/Sec   141.56     47.74   202.00     62.30%
  27901 requests in 10.01s, 8.43MB read
Requests/sec:   2787.21
Transfer/sec:    862.84KB
```

## Dynamic with URL parameter

```
Running 10s test @ http://127.0.0.1:3000/hello/test
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    32.57ms    4.79ms  83.89ms   87.80%
    Req/Sec   308.08     51.21   404.00     74.45%
  61355 requests in 10.01s, 9.13MB read
Requests/sec:   6131.27
Transfer/sec:      0.91MB
```

## Get stream

```
Running 10s test @ http://127.0.0.1:3000/stream
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    40.98ms    3.77ms  91.66ms   86.96%
    Req/Sec   244.70     48.74   303.00     62.65%
  48742 requests in 10.02s, 483.76MB read
Requests/sec:   4866.56
Transfer/sec:     48.30MB
```

## POST stream pipe

```
Running 10s test @ http://127.0.0.1:3000/stream
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    84.18ms   12.18ms 162.21ms   87.45%
    Req/Sec   119.67     21.26   202.00     82.73%
  23825 requests in 10.10s, 2.38GB read
Requests/sec:   2359.26
Transfer/sec:    241.27MB
```

## POST large send

```
Running 10s test @ http://127.0.0.1:3000/stream/send
  20 threads and 200 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency   150.05ms   12.27ms 225.21ms   76.71%
    Req/Sec    73.50     26.88   101.00     74.80%
  13250 requests in 10.10s, 1.32GB read
Requests/sec:   1312.00
Transfer/sec:    133.54MB
```

## WS Echo

```
Start 4 threads, duration 10s

Connection Latency:
  Max: 1394 ms
  Min: 86 ms
  Mean: 326.1358333333333 ms
  Median: 173 ms
  StdDev: 381.81219881037936 ms

Echo Latency:
  Max: 212 ms
  Min: 2 ms
  Mean: 63.72845656224209 ms
  Median: 59 ms
  StdDev: 28.783255125925194 ms

Connection/sec: 360
Echo/sec: 20234.7
Transfer/sec: 19.76044921875 MB
```

## WS fast-ws protocol

```
Start 4 threads, duration 10s

Connection Latency:
  Max: 2349 ms
  Min: 82 ms
  Mean: 809.655 ms
  Median: 314.5 ms
  StdDev: 791.8666952952733 ms

Echo Latency:
  Max: 507 ms
  Min: 5 ms
  Mean: 132.2237181159893 ms
  Median: 141 ms
  StdDev: 74.42470351761017 ms

Connection/sec: 280
Echo/sec: 12263.2
Transfer/sec: 11.97578125 MB
```

# Socket.io

```
STARTUP: 0.121ms
```

## WS Socket.IO

```
Start 4 threads, duration 10s

Connection Latency:
  Max: 6877 ms
  Min: 407 ms
  Mean: 2672.192186266772 ms
  Median: 3046 ms
  StdDev: 1680.180281627788 ms

Echo Latency:
  Max: 4747 ms
  Min: 17 ms
  Mean: 165.49608368200836 ms
  Median: 94 ms
  StdDev: 299.83632384624906 ms

Connection/sec: 253.4
Echo/sec: 5975
Transfer/sec: 5.8349609375 MB
```

