#!/bin/sh

SRC=$(dirname $0)

sed -i '' -e 's|BIO_get_flags\(([[:alnum:]_]*)\)|BIO_test_flags(\1, ~(0x0))|g' "$SRC/uWebSockets.js/uWebSockets/uSockets/src/crypto/openssl.c"
