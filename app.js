import Highway from '@dogstudio/highway';

import Fade from './fade';

const H = new Highway.Core({
  transitions: {
    default: Fade
  }
});