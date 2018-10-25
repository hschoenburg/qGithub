## qGithub






## Usage
``` javascript

var qGithub = require('qGithub')

var qg  = new qGithub({token: $token, username: $username})

let scores = await qg.score()  
// returns { real: int, foss: int}

```

This is no AI. But it is useful. Scores range from 0-30. A 'real' score of 30 means the user account is genuine 99% of the time. Don't believe me, try running the test suite. Use the environment vars FAKE_USERS and REAL_USERS to try and sneak a fake account past this library. Run `jasmine` to see if you've succeeded. NOTE: the test suite neeeds a valid OAuth token in the env var TEST_TOKEN.

``` javascript

function score()


/* Params
 *  
 *  token     | Github OAuth access token |
 *  username  | username to score |
 *  job       | (optional) passthrough object, helpful when used in a message queue |
 */


/* Return values
 *  
 *  real  | [0-30] 0 = definitely inactive, probably fake,  30 = very active, very real |
 *  foss  | [0-30] 0 = little to no public repo activity. 30 = very active in popular repos |
 */

```

## Testing

`npm run test` or just `jasmine` will run test suite.

VCR_MODE env var will toggle sepia, for http request record/playback. Add '.fixtures' to your `.gitignore` to ignore sepia's storage.

See `example.env` for other VARS helpful for testing.


## Support

Find me on [freenode][freenode] as [dolokhov]


