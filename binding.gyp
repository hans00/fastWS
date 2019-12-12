{
  'variables': {
    'runtime%': 'node'
  },
  'target_defaults': {
    'cflags': [
      '-flto',
      '-O3',
    ],
    'cflags_cc': [
      '-std=c++17'
    ],
    'include_dirs': [
      'src/uWebSockets.js/uWebSockets/uSockets/src',
      'src/uWebSockets.js/uWebSockets/src',
    ],
    'defines': [
      'LIBUS_USE_LIBUV',
      'LIBUS_USE_OPENSSL'
    ],
    'defines!': [
      'OPENSSL_THREADS'
    ],
    'conditions': [
      ['OS=="win"', {
        'msvs_settings': {
          'VCCLCompilerTool': {
            'AdditionalOptions': [
              '/std:c++17',
              '/Ox',
            ]
          }
        },
      }],
      ['OS=="linux"', {
        'cflags_cc+': [ '-std=c++17' ],
      }],
      ['OS=="mac"', {
        'xcode_settings': {
          'OTHER_CFLAGS': [
            '-flto',
            '-O3',
          ],
          'OTHER_CPLUSPLUSFLAGS': [
            '-std=c++17',
            '-stdlib=libc++',
            '-flto',
            '-O3',
          ],
        },
      }],
      # This is the condition for using boringssl
      ['runtime=="electron"', {
        "include_dirs": [
          "deps/boringssl/include"
        ],
        "defines": [
          'OPENSSL_NO_ASM',
        ],
      }, {
        'conditions': [
          ["target_arch=='ia32'", {
             "include_dirs": [ "<(node_root_dir)/deps/openssl/config/piii" ]
          }],
          ["target_arch=='x64'", {
             "include_dirs": [ "<(node_root_dir)/deps/openssl/config/k8" ]
          }],
          ["target_arch=='arm'", {
             "include_dirs": [ "<(node_root_dir)/deps/openssl/config/arm" ]
          }]
        ]
      }],
      ['OS == "win"', {
        "include_dirs": [
          "deps/zlib"
        ],
        "defines": [
          '_WIN32_WINNT=0x0600',
          'WIN32_LEAN_AND_MEAN',
          '_HAS_EXCEPTIONS=0',
          'UNICODE',
          '_UNICODE',
          'NOMINMAX',
        ],
        "msvs_settings": {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 1, # static debug
          }
        },
        "libraries": [
          "ws2_32"
        ]
      }, { # OS != "win"
        'include_dirs': [
          '<(node_root_dir)/deps/zlib'
        ]
      }]
    ]
  },
  'conditions': [
    ['runtime=="electron"', {
      'targets': [
        {
          'target_name': 'boringssl',
          'product_prefix': 'lib',
          'type': 'static_library',
          'cflags': [
            '-Wno-implicit-fallthrough'
          ],
          'defines': [
            '_XOPEN_SOURCE=700'
          ],
          'dependencies': [
          ],
          'sources': [
            '<!@(ls -1 deps/boringssl/crypto/*/*.c)',
            '<!@(ls -1 deps/boringssl/crypto/*.c)',
            'deps/boringssl/ssl/bio_ssl.cc',
            'deps/boringssl/ssl/d1_both.cc',
            'deps/boringssl/ssl/d1_lib.cc',
            'deps/boringssl/ssl/d1_pkt.cc',
            'deps/boringssl/ssl/d1_srtp.cc',
            'deps/boringssl/ssl/dtls_method.cc',
            'deps/boringssl/ssl/dtls_record.cc',
            'deps/boringssl/ssl/handoff.cc',
            'deps/boringssl/ssl/handshake.cc',
            'deps/boringssl/ssl/handshake_client.cc',
            'deps/boringssl/ssl/handshake_server.cc',
            'deps/boringssl/ssl/s3_both.cc',
            'deps/boringssl/ssl/s3_lib.cc',
            'deps/boringssl/ssl/s3_pkt.cc',
            'deps/boringssl/ssl/ssl_aead_ctx.cc',
            'deps/boringssl/ssl/ssl_asn1.cc',
            'deps/boringssl/ssl/ssl_buffer.cc',
            'deps/boringssl/ssl/ssl_cert.cc',
            'deps/boringssl/ssl/ssl_cipher.cc',
            'deps/boringssl/ssl/ssl_file.cc',
            'deps/boringssl/ssl/ssl_key_share.cc',
            'deps/boringssl/ssl/ssl_lib.cc',
            'deps/boringssl/ssl/ssl_privkey.cc',
            'deps/boringssl/ssl/ssl_session.cc',
            'deps/boringssl/ssl/ssl_stat.cc',
            'deps/boringssl/ssl/ssl_transcript.cc',
            'deps/boringssl/ssl/ssl_versions.cc',
            'deps/boringssl/ssl/ssl_x509.cc',
            'deps/boringssl/ssl/t1_enc.cc',
            'deps/boringssl/ssl/t1_lib.cc',
            'deps/boringssl/ssl/tls13_both.cc',
            'deps/boringssl/ssl/tls13_client.cc',
            'deps/boringssl/ssl/tls13_enc.cc',
            'deps/boringssl/ssl/tls13_server.cc',
            'deps/boringssl/ssl/tls_method.cc',
            'deps/boringssl/ssl/tls_record.cc',
            'deps/boringssl/third_party/fiat/curve25519.c',
          ],
          'conditions': [
            ['OS == "mac"', {
              'xcode_settings': {
                'MACOSX_DEPLOYMENT_TARGET': '10.9'
              }
            }]
          ]
        },
      ],
    }],
    ['OS == "win"', {
      'targets': [
        # Only want to compile zlib under Windows
        {
          'target_name': 'z',
          'product_prefix': 'lib',
          'type': 'static_library',
          'dependencies': [
          ],
          'sources': [
            'deps/zlib/adler32.c',
            'deps/zlib/compress.c',
            'deps/zlib/crc32.c',
            'deps/zlib/deflate.c',
            'deps/zlib/gzclose.c',
            'deps/zlib/gzlib.c',
            'deps/zlib/gzread.c',
            'deps/zlib/gzwrite.c',
            'deps/zlib/infback.c',
            'deps/zlib/inffast.c',
            'deps/zlib/inflate.c',
            'deps/zlib/inftrees.c',
            'deps/zlib/trees.c',
            'deps/zlib/uncompr.c',
            'deps/zlib/zutil.c',
          ]
        },
      ]
    }]
  ],
  'targets': [
    {
      'target_name': 'uWS',
      'sources': [
        '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/*.c)',
        '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/eventing/*.c)',
        '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/crypto/*.c)',
        'src/uWebSockets.js/src/addon.cpp',
      ],
      'dependencies': [],
      'conditions': [
        ['OS=="linux"', {
          'cflags_c+': [ '-std=c++17' ],
          'cflags_cc+': [ '-std=c++17' ],
        }],
        ['runtime=="electron"', {
          'dependencies': [ 'boringssl' ],
        }],
        ['OS=="win"', {
          'dependencies': [ 'z' ]
        }]
      ],
    }
  ]
}
