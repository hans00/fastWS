{
  'variables': {
    'runtime%': 'node'
  },
  'target_defaults': {
    'cflags': [
      '-flto',
      '-O3',
      '-pthread'
    ],
    'cflags_cc': [
      '-std=c++17',
      '-pthread'
    ],
    'ldflags': [
      '-pthread'
    ],
    'include_dirs': [
      'deps/uWebSockets.js/uWebSockets/uSockets/src',
      'deps/uWebSockets.js/uWebSockets/uSockets/lsquic/include',
      'deps/uWebSockets.js/uWebSockets/uSockets/boringssl/include',
      'deps/uWebSockets.js/uWebSockets/src',
      # 'deps/uWebSockets.js/uWebSockets/libdeflate',
    ],
    'defines': [
      'LIBUS_USE_QUIC',
      'UWS_WITH_PROXY',
      # 'UWS_USE_LIBDEFLATE',
      'LIBUS_USE_LIBUV',
      'LIBUS_USE_OPENSSL',
      'OPENSSL_API_COMPAT=0x10100001L',
      'OPENSSL_CONFIGURED_API=10100',
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
        'cflags_c+': [ '-std=gnu11' ],
        'cflags_cc+': [ '-std=c++17' ],
      }],
      ['OS=="mac"', {
        'xcode_settings': {
          'OTHER_CFLAGS': [
            '-flto',
            '-O3',
            '-pthread',
            '-std=c11',
          ],
          'OTHER_CPLUSPLUSFLAGS': [
            '-std=c++17',
            '-stdlib=libc++',
            '-flto',
            '-O3',
            '-pthread',
          ],
        },
      }],
      ["target_arch=='ia32'", {
         "include_dirs": [ "<(node_root_dir)/deps/openssl/config/piii" ]
      }],
      ["target_arch=='x64'", {
         "include_dirs": [ "<(node_root_dir)/deps/openssl/config/k8" ]
      }],
      ["target_arch=='arm'", {
         "include_dirs": [ "<(node_root_dir)/deps/openssl/config/arm" ]
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
    }],
  ],
  'targets': [
    {
      'target_name': 'uWS',
      'sources': [
        '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/uSockets/src/ .c)',
        '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/uSockets/src/eventing/ .c)',
        '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/uSockets/src/crypto/ .c)',
        'deps/uWebSockets.js/src/addon.cpp',
        'deps/uWebSockets.js/uWebSockets/uSockets/src/crypto/sni_tree.cpp',
      ],
      'dependencies': [
        # 'deflate',
        'boringssl',
        'lsquic',
      ],
      'conditions': [
        ['OS=="linux"', {
          'cflags_c+': [ '-std=c++17' ],
          'cflags_cc+': [ '-std=c++17' ],
        }],
        ['OS=="win"', {
          'dependencies': [ 'z' ]
        }]
      ],
    },
    {
      'target_name': 'boringssl',
      'product_prefix': 'lib',
      'type': 'static_library',
      'sources': [
        '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/uSockets/boringssl/ssl/ .cc test)',
        '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/uSockets/boringssl/crypto/ .c test)',
      ]
    },
    # {
    #   'target_name': 'deflate',
    #   'product_prefix': 'lib',
    #   'type': 'static_library',
    #   'sources': [
    #     '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/libdeflate/lib/ .c test)',
    #   ]
    # },
    {
      'target_name': 'lsquic',
      'product_prefix': 'lib',
      'type': 'static_library',
      'dependencies': [ 'boringssl' ],
      'defines': [
        'XXH_HEADER_NAME="xxhash.h"',
      ],
      'include_dirs': [
        'deps/uWebSockets.js/uWebSockets/uSockets/lsquic/src/lshpack/deps/xxhash',
      ],
      'sources': [
        '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/uSockets/lsquic/src/liblsquic/ .cc test)',
        '<!@(node find_files.js deps/uWebSockets.js/uWebSockets/uSockets/lsquic/src/lshpack/deps/ .cc test)',
        'deps/uWebSockets.js/uWebSockets/uSockets/lsquic/src/lshpack/lshpack.c',
      ]
    },
  ]
}
