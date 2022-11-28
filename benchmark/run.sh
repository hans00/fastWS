#!/bin/bash

if ! which wrk 2>&1 > /dev/null; then
  echo 'Error: Not found `wrk`'
  exit 1
fi

THIS_SCRIPT=$(realpath $0)
WORKDIR=$(dirname $THIS_SCRIPT)

HTTP_CONN=${HTTP_CONN:=200}
HTTP_THREAD=${HTTP_THREAD:=20}
HTTP_DUR=${HTTP_DUR:=10s}

WS_DUR=${WS_DUR:=10}
WS_RAMPUP=${WS_RAMPUP:=400}
WS_MESSAGE=${WS_MESSAGE:=10000}
WS_THREAD=${WS_THREAD:=4}
WS_TIMEOUT=${WS_TIMEOUT:=3000}

HTTP_BENCH="wrk -c $HTTP_CONN -t $HTTP_THREAD -d $HTTP_DUR"
WS_BENCH="$WORKDIR/bench-ws.js --duration $WS_DUR --ramp-up $WS_RAMPUP --counts $WS_MESSAGE --threads $WS_THREAD --timeout $WS_TIMEOUT"

function sync_block {
  echo $1
  echo
  echo '```'
  ${@:2} 2>&1
  echo '```'
  echo
}

function async_block {
  echo $1
  echo
  echo '```'
  ${@:2} 2>&1 &
  sleep 1
  echo '```'
  echo
}

function cleanup {
  jobs -p | xargs kill
}

cd "$WORKDIR"

case $1 in
  info )
    echo "# Hardware Info"
    echo
    echo "- CPU: $(node -e 'console.log(require("os").cpus()[0].model)')"
    echo "- Logical Cores: $(nproc 2>/dev/null || sysctl -n hw.logicalcpu)"
    echo "- Memory: $(node -e 'console.log(require("os").totalmem()/1024/1024/1024)') GB"
    echo
    ;;
  fast-ws )
    async_block "# Fast WS" \
      node fast-ws.js
    sync_block "## Static file without cache" \
      $HTTP_BENCH http://127.0.0.1:3000
    sync_block "## Dynamic with URL parameter" \
      $HTTP_BENCH http://127.0.0.1:3000/hello/test
    sync_block "## Get stream" \
      $HTTP_BENCH http://127.0.0.1:3000/stream
    sync_block "## POST stream pipe" \
      $HTTP_BENCH http://127.0.0.1:3000/stream -s "$WORKDIR/post.lua"
    sync_block "## POST large send" \
      $HTTP_BENCH http://127.0.0.1:3000/stream/send -s "$WORKDIR/post.lua"
    sync_block "## WS Echo" \
      $WS_BENCH ws://127.0.0.1:3000/echo
    sync_block "## WS fast-ws protocol" \
        $WS_BENCH ws://127.0.0.1:3000/fws --module fast-ws
    cleanup
    ;;
  nanoexpress )
    async_block "# nanoexpress" \
      node nanoexpress.js
    sync_block "## Static file without cache" \
      $HTTP_BENCH http://127.0.0.1:3000
    sync_block "## Dynamic with URL parameter" \
      $HTTP_BENCH http://127.0.0.1:3000/hello/test
    sync_block "## Get stream" \
      echo "Unsupported"
    sync_block "## POST stream pipe" \
      echo "Unsupported"
    sync_block "## POST large send" \
      $HTTP_BENCH http://127.0.0.1:3000/stream/send -s "$WORKDIR/post.lua"
    sync_block "## WS Echo" \
      $WS_BENCH ws://127.0.0.1:3000/echo
    sync_block "## WS fast-ws protocol" \
      $WS_BENCH ws://127.0.0.1:3000/fws --module fast-ws
    cleanup
    ;;
  express )
    async_block "# express.js" \
      node express-ws.js
    sync_block "## Static file without cache" \
      $HTTP_BENCH http://127.0.0.1:3000
    sync_block "## Dynamic with URL parameter" \
      $HTTP_BENCH http://127.0.0.1:3000/hello/test
    sync_block "## Get stream" \
      $HTTP_BENCH http://127.0.0.1:3000/stream
    sync_block "## POST stream pipe" \
      $HTTP_BENCH http://127.0.0.1:3000/stream -s "$WORKDIR/post.lua"
    sync_block "## POST large send" \
      $HTTP_BENCH http://127.0.0.1:3000/stream/send -s "$WORKDIR/post.lua"
    sync_block "## WS Echo" \
      $WS_BENCH ws://127.0.0.1:3000/echo
    sync_block "## WS fast-ws protocol" \
      $WS_BENCH ws://127.0.0.1:3000/fws --module fast-ws
    cleanup
    ;;
  socket-io )
    async_block "# Socket.io" \
      node socket-io.js
    sync_block "## WS Socket.IO" \
      $WS_BENCH ws://127.0.0.1:3000 --module socket.io-client
    cleanup
    ;;
  all )
    "$THIS_SCRIPT" info
    "$THIS_SCRIPT" fast-ws
    "$THIS_SCRIPT" nanoexpress
    "$THIS_SCRIPT" express
    "$THIS_SCRIPT" socket-io
    ;;
  * )
    echo "Usage: $0 <target>"
    echo
    echo -e "\tTargets:"
    echo -e "\t fast-ws"
    echo -e "\t express"
    echo -e "\t socket-io"
    echo -e "\t nanoexpress"
    echo -e "\t all"
esac
