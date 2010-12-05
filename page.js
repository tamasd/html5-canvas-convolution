// since spawning a worker is resource heavy
// we only do it once
var worker = new Worker('convolution.js');

/**
 * jQuery UI dialog default options.
 */
var dialogopts = {
  autoOpen: false,
  closeOnEscape: false,
  modal: true,
  resizable: false
};

/**
 * Container for the action functions.
 *
 * These functions are the part of the event handling system.
 */
var actions = {};

/**
 * Closes the imag loading overlay and displays the downloaded image.
 */
actions.display = function(data) {
  $('a.ui-dialog-titlebar-close').trigger('click');
  document.getElementById('image')
    .getContext('2d')
    .putImageData(data, 0, 0);
};

/**
 * Opens the progress bar in a dialog.
 */
actions.initProgress = function(max) {
  var dlg = $('<div id="convolution-progress-dialog">' +
    '<span>Calculating...</span><progress></progress></div>')
    .dialog(dialogopts);

  $('progress', dlg)
    .attr('max', max)
    .attr('value', 0);

  dlg.dialog('open');
};

/**
 * Updates the progress bar value.
 */
actions.setProgress = function(val) {
  $('div#convolution-progress-dialog progress')
    .attr('value', val);
};

/**
 * List of the available convolution masks.
 */
var masks = {};

/**
 * Sets the matrix dimension.
 *
 * @param {Integer} value
 */
function setMatrixDimension(value) {
  $('form#mask input[type=range]')
    .val(value)
    .change();
}

/**
 * Displays a matrix in the UI.
 *
 * @param {Array} matrix
 * @param {Boolean} checkdivide
 */
function setMatrix(matrix, checkdivide) {
  $('form#mask fieldset.mask div input')
    .each(function(i, item) {
      $(item).val(matrix[i]);
    });
  $('form#mask fieldset.mask input[name=divide]')
    .attr('checked', Boolean(checkdivide));
}

/**
 * Creates an empty matrix.
 *
 * @param {Integer} dimension
 * @return {Array}
 */
function newMatrix(dimension) {
  var matrix = [];

  if(dimension == null) {
    dimension = getMaskDimension();
  }
  dimension *= dimension;

  for(var i = 0; i < dimension; i++) {
    matrix[i] = 0;
  }

  return matrix;
}

/**
 * Generates a matrix with a generator function.
 *
 * @param {function} generator
 * @param {Boolean} divide
 */
function generateMatrix(generator, divide) {
  var matrix = newMatrix();

  var dimension = getMaskDimension();

  var max = Math.ceil(dimension / 2);

  for(var baseoffset = 0; baseoffset < dimension/2; baseoffset++) {
    for(var i = 0; i < max; i++) {
      var item = generator(baseoffset, i);

      matrix[baseoffset*dimension + i] = item;
      matrix[baseoffset*dimension + (dimension - i - 1)] = item;
      matrix[(dimension - baseoffset - 1)*dimension + i] = item;
      matrix[(dimension - baseoffset - 1)*dimension + (dimension - i - 1)] = item;
    }
  }

  setMatrix(matrix, divide);
}

/**
 * Average mask.
 */
masks.average = function() {
  $('form#mask fieldset.mask div input')
    .val(1);
  $('form#mask fieldset.mask input[name=divide]')
    .attr('checked', true);
};

/**
 * Weighted average mask.
 */
masks.weighted_average = function() {
  generateMatrix(function(baseoffset, i) {
    return Math.pow(2, baseoffset + i);
  }, true);
}

/**
 * Gauss function.
 */
function gauss(x, y, sigma) {
  return (1/(2*Math.PI*sigma*sigma))*Math.exp(-(x*x + y*y) / (2*sigma*sigma));
}

/**
 * General gauss mask.
 */
masks.general_gauss = function() {
  var sigma = parseFloat(prompt('Enter the sigma parameter', 2));
  if(isNaN(sigma)) {
    sigma = 2;
  }

  var dimension = getMaskDimension();

  generateMatrix(function(baseoffset, i) {
    return gauss(baseoffset - dimension, i - dimension, sigma);
  }, true);
}

/**
 * Point detector mask.
 */
masks.point_detection = function() {
  var dimension = getMaskDimension();
  var middle = Math.floor(dimension / 2);
  var value = dimension*dimension - 1;
  generateMatrix(function(baseoffset, i) {
    return (baseoffset == middle && i == middle) ?
      value:
      -1;
  }, false);
}

/**
 * Roberts X mask.
 */
masks.roberts_x = function() {
  setMatrixDimension(3);
  setMatrix([
    0, 0, -1,
    0, 1, 0,
    0, 0, 0
  ], false);
}

/**
 * Roberts Y mask.
 */
masks.roberts_y = function() {
  setMatrixDimension(3);
  setMatrix([
    -1, 0, 0,
    0, 1, 0,
    0, 0, 0
  ], false);
}

/**
 * Prewitt X mask.
 */
masks.prewitt_x = function() {
  setMatrixDimension(3);
  set3x3GradientMaskX(1, 1);
}

/**
 * Prewitt Y mask.
 */
masks.prewitt_y = function() {
  setMatrixDimension(3);
  set3x3GradientMaskY(1, 1);
}

/**
 * Sobel X mask.
 */
masks.sobel_x = function() {
  setMatrixDimension(3);
  set3x3GradientMaskX(1, 2);
}

/**
 * Sobel Y mask.
 */
masks.sobel_y = function() {
  setMatrixDimension(3);
  set3x3GradientMaskY(1, 2);
}

/**
 * Frei-Chen X mask.
 */
masks.FreiChen_x = function() {
  setMatrixDimension(3);
  set3x3GradientMaskX(1, Math.SQRT2);
}

/**
 * Frei-Chen Y mask.
 */
masks.FreiChen_y = function() {
  setMatrixDimension(3);
  set3x3GradientMaskY(1, Math.SQRT2);
}

/**
 * Scharr X mask.
 */
masks.scharr_x = function() {
  setMatrixDimension(3);
  set3x3GradientMaskX(3, 10);
}

/**
 * Scharr Y mask.
 */
masks.scharr_y = function() {
  setMatrixDimension(3);
  set3x3GradientMaskY(3, 10);
}

/**
 * 5x5 approximation of the LoG function.
 */
masks.LoG_5x5 = function() {
  setMatrixDimension(5);
  setMatrix([
     0,  0, -1,  0,  0,
     0, -1, -2, -1,  0,
    -1, -2, 16, -2, -1,
     0, -1, -2, -1,  0,
     0,  0, -1,  0,  0,
  ], false);
}

/**
 * Triangular 5x5 mask.
 */
masks.triangular_5x5 = function() {
  setMatrixDimension(5);
  var sequence = [0, 0, 1, 2, 5];
  generateMatrix(function(baseoffset, i) {
    return sequence[baseoffset + i];
  }, true);
}

/**
 * Rotates a matrix by 90 degrees.
 *
 * @param {Array} matrix
 * @return {Array}
 */
function rotateMatrix90(matrix) {
  var retmtx = [];
  var max = Math.sqrt(matrix.length);
  var i = 1, j = 0;
  while (i <= max) {
    j = max - 1;
    while (j >= 0) {
      var index = j * max + i;
      retmtx.push(matrix[index - 1]);
      j--;
    }
    i++;
  }

  return retmtx;
}

/**
 * Rotates a matrix by 180 degrees.
 *
 * @param {Array} matrix
 * @return {Array}
 */
function rotateMatrix180(matrix) {
  var retmtx = matrix.slice(0);
  return retmtx.reverse();
}

/**
 * Rotates a matrix by 270 degrees.
 *
 * @param {Array} matrix
 * @return {Array}
 */
function rotateMatrix270(matrix) {
  return rotateMatrix180(rotateMatrix90(matrix));
}

/**
 * Basic compass masks.
 */
var compass_masks = {
  Prewitt: [
    [
      1,  1, -1,
      1, -2, -1,
      1,  1, -1
    ],
    [
      1, -1, -1,
      1, -2, -1,
      1,  1,  1
    ]
  ],
  Robinson_3: [
    [
      1, 0, -1,
      1, 0, -1,
      1, 0, -1,
    ],
    [
      0, -1, -1,
      1,  0, -1,
      1,  1,  0
    ]
  ],
  Robinson_5: [
    [
      1, 0, -1,
      2, 0, -2,
      1, 0, -1
    ],
    [
      0, -1, -2,
      1,  0, -1,
      2,  1,  0
    ]
  ],
  Kirsch: [
    [
      5, -3, -3,
      5,  0, -3,
      5, -3, -3
    ],
    [
      -3, -3, -3,
       5,  0, -3,
       5,  5, -3
    ]
  ]
};

/**
 * This function creates compass masks by
 * rotating the basic compass masks.
 *
 * @param {String} name
 * Name of the mask.
 * @param {Array} E
 * East matrix.
 * @param {Array} NE
 * North-east matrix.
 */
function createCompassMask(name, E, NE) {
  masks[name + '_E'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(E, false);
  };
  masks[name + '_NE'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(NE, false);
  };
  masks[name + '_N'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(rotateMatrix270(E), false);
  };
  masks[name + '_NW'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(rotateMatrix270(NE), false);
  };
  masks[name + '_W'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(rotateMatrix180(E), false);
  };
  masks[name + '_SW'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(rotateMatrix180(NE), false);
  };
  masks[name + '_S'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(rotateMatrix90(E), false);
  };
  masks[name + '_SE'] = function() {
    setMatrixDimension(Math.sqrt(E.length));
    setMatrix(rotateMatrix90(NE), false);
  };
}

for(var name in compass_masks) {
  createCompassMask(name, compass_masks[name][0], compass_masks[name][1]);
}

/**
 * Sets a 3x3 X gradient mask.
 *
 * @param {Integer} p
 * @param {Integer} q
 */
function set3x3GradientMaskX(p, q) {
  setMatrix([
    p, 0, -p,
    q, 0, -q,
    p, 0, -p
  ], false);
}

/**
 * Sets a 3x3 Y gradient mask.
 *
 * @param {Integer} p
 * @param {Integer} q
 */
function set3x3GradientMaskY(p, q) {
  setMatrix([
    p, q, p,
    0, 0, 0,
    -p, -q, -p
  ], false);
}

/**
 * Returns the mask dimension.
 *
 * @return {Integer}
 */
function getMaskDimension() {
  return $('form#mask input[type=range]')
    .val();
}

/**
 * Returns the mask size.
 *
 * @return {Integer}
 */
function getMaskSize() {
  var masksize = $('form#mask input[type=range]')
    .val();
  return masksize * masksize;
}

/**
 * Returns the mask.
 *
 * @return {Array}
 */
function getMask() {
  var mask = [];
  var masksize = $('form#mask input[type=range]')
    .val();
  var row = [];

  var divide = $('form#mask fieldset.mask input[name=divide]')
    .attr('checked');

  var divisor = 0;
  if(divide) {
    $('form#mask fieldset.mask input')
      .each(function(i, item) {
        var val = $(item).val();
        if(isNaN(val)) {
          val = 0.0;
        }
        divisor += parseFloat(val);
      });
  }

  $('form#mask fieldset.mask input')
    .each(function(i, item) {
      var val = parseFloat($(item).val());
      if(isNaN(val)) {
        val = 0.0;
      }
      if(divide) {
        val /= divisor;
      }
      row[row.length] = val;
      if((i + 1) % masksize === 0) {
        mask[mask.length] = row;
        row = [];
      }
    });

  return mask;
}

/**
 * Puts an image to the canvas.
 *
 * @param {String} canvas
 * The id of the canvas.
 * @param {String} url
 * URL of the image.
 */
function setCanvasImage(canvas, url) {
  $('#'+canvas).parent()
    .html('')
    .html('<canvas id="image"></canvas>');
  var can = document.getElementById(canvas);
  var ctx = can.getContext('2d');
  var dialog = $('<div id="image-loading-dialog">Image is loading...</div>')
    .dialog(dialogopts);
  var img = new Image();
  img.onload = function() {
    $('a.ui-dialog-titlebar-close').trigger('click');
    can.width = img.width;
    can.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);
  };
  dialog.dialog('open');
  img.src = url;
}

/**
 * Returns a random string.
 *
 * @return {String}
 */
function getRandomString() {
  return Math.random().toString().split('.')[1];
}

$(function() {

  $('h1')
    .before('<a href="#" id="minimize">minimize</a>')
    .before('<a href="#" id="restore">restore</a>');

  $('a#minimize')
    .click(function(event) {
      event.preventDefault();
      $('section.main').children().not('a#restore')
      .slideUp('slow');
      $('a#restore').slideDown('slow');
      return false;
    });
  $('a#restore')
    .hide()
    .click(function(event) {
      event.preventDefault();
      $('section.main').children().not('a#restore')
      .slideDown('slow');
      $('a#restore').slideUp('slow');
      return false;
    });

  $('h1')
    .click(function() {
      window.location.reload();
    });

  for(var i in masks) {
    var item = $('<a></a>');
    item
      .attr('href', '#')
      .attr('id', 'apply_' + i + '_mask')
      .html(String(i.charAt(0).toUpperCase() + i.slice(1)).replace(/_/g, ' '))
      .click(function(event) {
        event.preventDefault();
        masks[$(this).attr('id').match(/^apply_([A-Za-z_0-9]*)_mask$/)[1]]();
        return false;
      });
    $('section.presets')
      .append(item);
  }

  $('form#url')
    .submit(function(event) {
      event.preventDefault();
      setCanvasImage('image', $('form#url input[name=image-url]').val());
      return false;
    });

  $('form#url-randompic')
    .submit(function(event) {
      event.preventDefault();
      // this part is converted to PHP,
      // because of the canvas element's
      // same origin policy
      setCanvasImage('image', 'randompic.php?rnd=' + getRandomString());
      return false;
    });
  $('form#url-randomcat')
    .submit(function(event) {
      event.preventDefault();
      setCanvasImage('image', 'randompic.php?tags=cats&rnd=' + getRandomString());
      return false;
    });

  $('form#url-random')
    .submit(function(event) {
      event.preventDefault();
      var tag = $('form#url-random input[name=image-tag]').val();
      setCanvasImage('image', 'randompic.php?tags=' + escape(tag) +
        '&rnd=' + getRandomString());
      return false;
    });

  $('form#download-image')
    .submit(function() {
      $('input[name=data]', $(this)).val(
        // parsing out the base64 encoded string from the data url
        document.getElementById("image").toDataURL().split(',', 2)[1]
      );
    });

  $('form#mask')
    .submit(function(event) {
      event.preventDefault();
      //doConvolution(document.getElementById('image'), getMask());
      var canvas = document.getElementById('image');
      var ctx = canvas.getContext('2d');
      var w = canvas.width, h = canvas.height;
      var input = ctx.getImageData(0, 0, w, h);
      var result = ctx.createImageData(w, h);
      worker.onmessage = function(event) {
        actions[event.data.action](event.data.data);
      }
      worker.postMessage({
        'input': input,
        'result': result,
        'w': w,
        'h': h,
        'mask': getMask()
      });
      return false;
    });

  $('form#mask input[type=range]')
    .change(function() {
      $('form#mask fieldset.mask div input').remove();
      var num = parseInt($(this).val(), 10);
      var html = '';
      for(var i = 0; i < num; i++) {
        for(var j = 0; j < num; j++) {
          html += "<input type=\"text\" value=\"0\" name=\"mask-" + i + "-" + j + "\" />\n";
        }
        html += '<br/>';
      }
      $('fieldset.mask div').html(html);
    })
    .trigger('change');

});
