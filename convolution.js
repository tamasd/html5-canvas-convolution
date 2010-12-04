
/**
 * Implementation of the classical convolution algorithm.
 *
 * @param {Array} input canvas imagedata
 * @param {Array} result canvas imagedata
 * @param {int} w width
 * @param {int} h height
 * @param {Array} mask the convolution mask
 */
function doConvolution(input, result, w, h, mask) {
  // floor instead of ceil, because we are
  // indexing from 0
  var maskhalf = Math.floor(mask.length / 2);

  var r = 0, g = 1, b = 2, alpha = 3;

  for(var y = 0; y < h-1; y++) {
    for(var x = 0; x < w-1; x++) {
      var pixel = (y*w + x)*4;
      var sumr = 0, sumg = 0, sumb = 0;
      for(var masky in mask) {
        for(var maskx in mask[masky]) {
          var convpixel = ((y+(masky-maskhalf)) * w + (x+(maskx-maskhalf))) * 4;
          sumr += input.data[convpixel + r] * mask[masky][maskx];
          sumg += input.data[convpixel + g] * mask[masky][maskx];
          sumb += input.data[convpixel + b] * mask[masky][maskx];
        }
      }
      result.data[pixel + r] = sumr;
      result.data[pixel + g] = sumg;
      result.data[pixel + b] = sumb;
      // just copy the alpha channel
      result.data[pixel + alpha] = input.data[pixel + alpha];
    }
    // posting a message to update the progress meter
    postMessage({
      action: 'setProgress',
      data: y
    });
  }

  return result;
}

/**
 * Event handler for 'onmessage'.
 */
onmessage = function(event) {
  var p = event.data;
  postMessage({
    action: 'initProgress',
    data: p.h - 1,
  });
  var result = doConvolution(p.input, p.result, p.w, p.h, p.mask);
  postMessage({
    action: 'display',
    data: result
  });
}