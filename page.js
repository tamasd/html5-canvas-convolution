// since spawning a worker is resource heavy
// we only do it once
var worker = new Worker('convolution.js');

var dialogopts = {
  autoOpen: false,
  closeOnEscape: false,
  modal: true,
  resizable: false
};

var actions = {};

actions.display = function(data) {
  $('a.ui-dialog-titlebar-close').trigger('click');
  document.getElementById('image')
    .getContext('2d')
    .putImageData(data, 0, 0);
};

actions.initProgress = function(max) {
  var dlg = $('<div id="convolution-progress-dialog"><progress>Calculating...</progress></div>')
    .dialog(dialogopts);
  
  $('progress', dlg)
    .attr('max', max)
    .attr('value', 0);

  dlg.dialog('open');
};

actions.setProgress = function(val) {
  $('div#convolution-progress-dialog progress')
    .attr('value', val);
};

var masks = {};

function setMatrixDimension(value) {
  $('form#mask input[type=range]')
    .val(value)
    .change();
}

function setMatrix(matrix, checkdivide) {
  $('form#mask fieldset.mask div input')
    .each(function(i, item) {
      $(item).val(matrix[i]);
    });
  $('form#mask fieldset.mask input[name=divide]')
    .attr('checked', Boolean(checkdivide));
}

function newMatrix() {
  var matrix = [];

  var dimension = getMaskDimension();
  dimension *= dimension;

  for(var i = 0; i < dimension; i++) {
    matrix[i] = 0;
  }

  return matrix;
}

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

masks.average = function() {
  $('form#mask fieldset.mask div input')
    .val(1);
  $('form#mask fieldset.mask input[name=divide]')
    .attr('checked', true);
};

masks.weighted_average = function() {
  generateMatrix(function(baseoffset, i) {
    return Math.pow(2, baseoffset + i);
  }, true);
}

function gauss(x, y, sigma) {
  return (1/(2*Math.PI*sigma*sigma))*Math.exp(-(x*x + y*y) / (2*sigma*sigma));
}

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

masks.prewitt_x = function() {
  setMatrixDimension(3);
  set3x3GradientMaskX(1, 1);
}

masks.prewitt_y = function() {
  setMatrixDimension(3);
  set3x3GradientMaskY(1, 1);
}

masks.sobel_x = function() {
  setMatrixDimension(3);
  set3x3GradientMaskX(1, 2);
}

masks.sobel_y = function() {
  setMatrixDimension(3);
  set3x3GradientMaskY(1, 2);
}

masks.FreiChen_x = function() {
  setMatrixDimension(3);
  set3x3GradientMaskX(1, Math.SQRT2);
}

masks.FreiChen_y = function() {
  setMatrixDimension(3);
  set3x3GradientMaskY(1, Math.SQRT2);
}

function set3x3GradientMaskX(p, q) {
  setMatrix([
    p, 0, -p,
    q, 0, -q,
    p, 0, -p
  ], false);
}

function set3x3GradientMaskY(p, q) {
  setMatrix([
    p, q, p,
    0, 0, 0,
    -p, -q, -p
  ], false);
}

function getMaskDimension() {
  return $('form#mask input[type=range]')
    .val();
}

function getMaskSize() {
  var masksize = $('form#mask input[type=range]')
    .val();
  return masksize * masksize;
}

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
      .html(String(i.charAt(0).toUpperCase() + i.slice(1)).replace('_', ' '))
      .click(function(event) {
        event.preventDefault();
        masks[$(this).attr('id').match(/^apply_([A-Za-z_]*)_mask$/)[1]]();
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
      setCanvasImage('image', 'randompic.php');
      return false;
    });
  $('form#url-randomcat')
    .submit(function(event) {
      event.preventDefault();
      setCanvasImage('image', 'randompic.php?tags=cats');
      return false;
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
