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

masks.average = function() {
  $('form#mask fieldset.mask div input')
  .val(1);
  $('form#mask fieldset.mask input[name=divide]')
  .attr('checked', true);
};

function getMask() {
  var mask = [];
  var masksize = $('form#mask input[type=range]').val();
  var row = [];

  var divide = $('form#mask fieldset.mask input[name=divide]')
  .attr('checked');

  $('form#mask fieldset.mask input').each(function(i, item) {
    var val = parseFloat($(item).val());
    if(isNaN(val)) {
      val = 0.0;
    }
    if(divide) {
      val /= masksize * masksize;
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

  $('a#minimize').click(function(event) {
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

  $('h1').click(function() {
    window.location.reload();
  });

  $('a#apply-average-mask').click(function(event) {
    event.preventDefault();
    masks.average();
    return false;
  });

  $('form#url').submit(function(event) {
    event.preventDefault();
    setCanvasImage('image', $('form#url input[name=image-url]').val());
    return false;
  });

  $('form#url-randompic').submit(function(event) {
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

  $('form#mask').submit(function(event) {
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
