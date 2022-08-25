# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.5.9](https://github.com/hans00/fastWS/compare/v2.5.8...v2.5.9) (2022-08-25)


### Features

* support `keepHeaderCase` ([4aa9295](https://github.com/hans00/fastWS/commit/4aa929510a774f370de09e8f897ab51d046674ab))


### Bug Fixes

* **Server:** should not replace status code ([34f9056](https://github.com/hans00/fastWS/commit/34f9056b62c6334f41efc33014d48029783237f5))



## [2.5.8](https://github.com/hans00/fastWS/compare/v2.5.7...v2.5.8) (2022-08-03)


### Bug Fixes

* **Server:** fix range-stream process ([d88dd30](https://github.com/hans00/fastWS/commit/d88dd3042824db03452be720626c609bdbe331fd))



## [2.5.7](https://github.com/hans00/fastWS/compare/v2.5.6...v2.5.7) (2022-08-03)


### Bug Fixes

* **Server:** correct Content-Range implement ([7e37844](https://github.com/hans00/fastWS/commit/7e378446655de4754b412974503cc619a25774af))



## [2.5.6](https://github.com/hans00/fastWS/compare/v0.1.0...v2.6.0) (2022-07-29)


### Features

* **Server:** add flag to disable range ([c74ee71](https://github.com/hans00/fastWS/commit/c74ee711f79bc8c4381631b088b21a243a702d98))
* **Server:** pretty custom error inspect ([ad7357e](https://github.com/hans00/fastWS/commit/ad7357e139ed1a8a8e4f868d12ff82feca5c4a8b))
* **Server:** should send `Content-Range` if not full body ([7d5a5f5](https://github.com/hans00/fastWS/commit/7d5a5f51590345987913eb07e2be4055d79517bc))
* **Server:** support for stream range ([01303cf](https://github.com/hans00/fastWS/commit/01303cfef9ba524b00a77008a20c5de58822abc6))

### [2.5.3](https://github.com/hans00/fastWS/compare/v2.5.2...v2.5.3) (2022-07-22)


### Features

* **Server:** support read body later ([63639d3](https://github.com/hans00/fastWS/commit/63639d33b774ac5ddf705b5ec43c88c846faab5d))

### [2.5.2](https://github.com/hans00/fastWS/compare/v2.5.1...v2.5.2) (2022-07-22)


### Features

* **Server:** support for body stream ([3bf1a07](https://github.com/hans00/fastWS/commit/3bf1a07ed0a54a4387033c0bbc783a2a6fb1856d))


### Bug Fixes

* **Server:** correct write end implements ([88068f1](https://github.com/hans00/fastWS/commit/88068f104de14514b6c557b43bff926d84836c46))

### [2.5.1](https://github.com/hans00/fastWS/compare/v2.5.0...v2.5.1) (2022-07-04)


### Bug Fixes

* **Server:** correct writable stream implement ([225bd13](https://github.com/hans00/fastWS/commit/225bd1365df83414ad84c9d0003b97295824d1c2))
* **Server:** fix `perf-standard/check-function-inline` ([a2520a2](https://github.com/hans00/fastWS/commit/a2520a24004faaa18391034f28fe0e14783f19f5))

## [2.5.0](https://github.com/hans00/fastWS/compare/v2.4.2...v2.5.0) (2022-07-03)


### ⚠ BREAKING CHANGES

* **Server:** setup exports

### Features

* **Server:** setup exports ([b8d9298](https://github.com/hans00/fastWS/commit/b8d929855d2b06698ecb7bd09a4a1b2127f04788))
