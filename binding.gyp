{
  'targets': [
    {
      'target_name': 'uWS',
      'include_dirs': [
        'src/uWebSockets.js/uWebSockets/uSockets/src',
        'src/uWebSockets.js/uWebSockets/src',
      ],
      'defines': [
        'LIBUS_USE_LIBUV',
      ],
      'cflags': [
        '-std=c++17',
        '-flto',
        '-O3',
      ],
      'conditions': [
        [ 'OS!="win"', {
          'sources': [
            'src/uWebSockets.js/src/addon.cpp',
          ],
          'dependencies': [ 'uWebSockets' ],
        } ],
        [ 'OS=="linux"', {
            'cflags+': [ '-std=c++17', '-flto', '-O3' ],
            'cflags_c+': [ '-std=c++17', '-flto', '-O3' ],
            'cflags_cc+': [ '-std=c++17', '-flto', '-O3' ],
        } ],
        [ 'OS=="win"', {
          'sources': [
            '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/*.c)',
            '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/eventing/*.c)',
            'src/uWebSockets.js/src/addon.cpp',
          ],
          'dependencies': [ 'uWebSockets' ],
          'msvs_settings': {
            'VCCLCompilerTool': {
              'AdditionalOptions': [
                '/std:c++17',
                '/0x',
              ]
            }
          },
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
        '<!@(ls -1 src/uWebSockets.js/uWebSockets/uSockets/src/eventing/*.c)'
      ],
      'include_dirs': [
        'src/uWebSockets.js/uWebSockets/uSockets/src',
      ],
      'defines': [
        'LIBUS_USE_LIBUV',
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
                '/0x',
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
