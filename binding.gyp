{
  'variables': {
    'node_shared_openssl%': 'true'
  },
  'targets': [
    {
      'target_name': 'uWS',
      'include_dirs': [
        'src/uWebSockets.js/uWebSockets/uSockets/src',
        'src/uWebSockets.js/uWebSockets/src',
        '<(node_root_dir)/deps/openssl/openssl/include',
      ],
      'defines': [
        'LIBUS_USE_LIBUV',
        'LIBUS_USE_OPENSSL',
      ],
      'cflags': [
        '-std=c++17',
        '-flto',
        '-O3',
      ],
      'conditions': [
        [ 'node_shared_openssl=="false"', {
          'include_dirs': [
            '<(node_root_dir)/deps/openssl/openssl/include'
          ],
          "conditions" : [
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
        } ],
        [ 'OS!="win"', {
          'sources': [
            'src/uWebSockets.js/src/addon.cpp',
          ],
          'dependencies': [ 'uWebSockets' ],
        } ],
        [ 'OS=="win"', {
          'sources': [
            '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/*.c)',
            '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/eventing/*.c)',
            '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/crypto/*.c)',
            'src/uWebSockets.js/src/addon.cpp',
          ],
          'dependencies': [ 'uWebSockets' ],
          'msvs_settings': {
            'VCCLCompilerTool': {
              'AdditionalOptions': [
                '/std:c++17',
                '/Ox',
              ]
            }
          },
        } ],
        [ 'OS=="linux"', {
            'cflags+': [ '-std=c++17', '-flto', '-O3' ],
            'cflags_c+': [ '-std=c++17', '-flto', '-O3' ],
            'cflags_cc+': [ '-std=c++17', '-flto', '-O3' ],
        } ],
        [ 'OS=="mac"', {
          'xcode_settings': {
            'OTHER_CFLAGS': [
              '-std=c++17',
              '-stdlib=libc++',
              '-flto',
              '-O3',
            ],
          },
        } ]
      ],
    },
    {
      'target_name': 'uWebSockets',
      'type': 'static_library',
      'sources': [
        '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/*.c)',
        '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/eventing/*.c)',
        '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/crypto/*.c)',
      ],
      'include_dirs': [
        'src/uWebSockets.js/uWebSockets/uSockets/src',
        '<(node_root_dir)/deps/openssl/openssl/include',
      ],
      'defines': [
        'LIBUS_USE_LIBUV',
        'LIBUS_USE_OPENSSL',
      ],
      'cflags': [
        '-flto',
        '-O3',
      ],
      'cflags_cc': [
        '-flto',
        '-O3',
      ],
      'conditions': [
        [ 'node_shared_openssl=="false"', {
          'include_dirs': [
            '<(node_root_dir)/deps/openssl/openssl/include'
          ],
          "conditions" : [
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
        } ],
        [ 'OS=="linux"', {
          'cflags+': [ '-flto', '-O3' ],
          'cflags_c+': [ '-flto', '-O3' ],
          'cflags_cc+': [ '-flto', '-O3' ],
        } ],
        [ 'OS=="win"', {
          'msvs_settings': {
            'VCCLCompilerTool': {
              'AdditionalOptions': [
                '/std:c++17',
                '/Ox',
              ]
            }
          },
        } ],
        [ 'OS=="mac"', {
          'xcode_settings': {
            'OTHER_CFLAGS': [
              '-flto',
              '-O3',
            ],
          },
        } ]
      ],
    }
  ]
}
