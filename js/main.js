window.book = null;
window.rendition = null;
window.highlights = document.getElementById('highlights');
window.nextButton = document.getElementById('next');
window.prevButton = document.getElementById('prev');
window.bookTitle = document.getElementById('book_title');
window.RENDITION_OPTS = {
  width: '70vw',
  height: '80vh',
  flow: 'paginated',
  ignoreClass: 'annotator-hl',
  // layout: 'paginated',
  // manager: 'continuous',
  restore: true,
  spread: 'auto',
  stylesheet: '/styles.css',
}

function keyListener(ev) {
  if (!window.book || !window.rendition) return;

  // Left Key
  if ((ev.keyCode || ev.which) == 37) {
    window.book.package.metadata.direction === 'rtl' ? window.rendition.next() : window.rendition.prev();
  }

  // Right Key
  if ((ev.keyCode || ev.which) == 39) {
    window.book.package.metadata.direction === 'rtl' ? window.rendition.prev() : window.rendition.next();
  }
};

window.addEventListener('DOMContentLoaded', function(ev) {
  nextButton?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!window.book || !window.rendition) return;
    book.package.metadata.direction === 'rtl' ? rendition.prev() : rendition.next();
  }, false);

  prevButton?.addEventListener('click', function(e) {
    e.preventDefault();
    if (!window.book || !window.rendition) return;
    book.package.metadata.direction === 'rtl' ? rendition.next() : rendition.prev();
  }, false);

  document.addEventListener('keyup', keyListener, false);

  document.querySelectorAll('.epub').forEach(function(a, idx) {
    a.addEventListener('click', function(ev) {
      ev.preventDefault();
      loadBook(ev.target.href)
      document.querySelector('#book_list details')?.removeAttribute('open');
    });

    if (idx === 0) {
      a.click()
    }
  });
});

function loadBook(url) {
  if (window.rendition) window.rendition.destroy();
  if (window.book) window.book.destroy();
  clearToC();

  window.book = ePub(url, { restore: true });
  window.rendition = window.book.renderTo('viewer', window.RENDITION_OPTS);

  const params = URLSearchParams && new URLSearchParams(document.location.search.substring(1));
  let currentSectionIndex = (params && params.get("loc")) ? params.get("loc") : undefined;

  rendition.display(currentSectionIndex);

  book.ready.then(function() {
    rendition.on('keyup', keyListener);
  })

  rendition.on('rendered', loadProgress);

  rendition.on('relocated', function(loc){
    // console.debug('relocated: location', loc)
    const next = book.package.metadata.direction === 'rtl' ? prevButton : nextButton
    const prev = book.package.metadata.direction === 'rtl' ? nextButton : prevButton

    next.style.visibility = loc.atEnd ? 'hidden' : 'visible';

    prev.style.visibility = loc.atStart ? 'hidden' : 'visible';
  });

  // Illustration of how to get text from a saved cfiRange
  rendition.on('selected', function(cfiRange, contents) {
    // Apply a class to selected text
    rendition.annotations.highlight(cfiRange, {}, function(e) {
      console.log('highlight clicked', e.target);
    });
    contents.window.getSelection().removeAllRanges();

    // add selection to highlights
    book.getRange(cfiRange).then(function (range) {
      var text;
      var li = document.createElement('li');
      var a = document.createElement('a');
      var remove = document.createElement('a');
      var textNode;

      if (range) {
        text = range.toString();
        textNode = document.createTextNode(text);

        a.textContent = cfiRange;
        a.href = '#' + cfiRange;
        a.onclick = function () {
          rendition.display(cfiRange);
        };

        remove.textContent = 'remove';
        remove.href = '#' + cfiRange;
        remove.style = 'margin: 0 0.5em;';
        remove.onclick = function (ev) {
          const remove = ev.target;

          rendition.annotations.remove(cfiRange);
          remove.parentElement.parentElement.removeChild(remove.parentElement);
          return false;
        };

        li.appendChild(a);
        li.appendChild(textNode);
        li.appendChild(remove);
        window.highlights.appendChild(li);
      }
    })
  });

  rendition.on('layout', function(layout) {
    const viewer = document.getElementById('viewer');

    // console.debug('rendition#layout: layout', layout);
    if (layout.spread) {
      viewer.classList.remove('single');
    } else {
      viewer.classList.add('single');
    }
  });

  window.addEventListener('unload', () => { this.book.destroy(); });
  book.loaded.navigation.then(loadToC);
}

function loadProgress(section) {
  if (!window.book || !window.rendition) return;

  const current = book.navigation && book.navigation.get(section.href);
  // console.debug('rendition#rendered: section', section);
  // console.debug('rendition#rendered: current', current);

  if (current) {
    const toc = document.getElementById('toc');
    const entries = toc.querySelectorAll('.toc-entry');
    let i = 0,
      entry = Array.from(toc.querySelectorAll('.toc-entry')).find(el => el.dataset.ref === current.href);

    if (entry) {
      entry.classList.remove('entry');
    }

    for (i = 0; i < entries.length; ++i) {
      entry = entries[i].dataset.ref === current.href;

      if (entry) {
        entries[i].classList.add('current');
      }
    }
  }
}

function tocEntryClick(ev) {
  ev.preventDefault();
  ev.stopPropagation();

  // console.debug('tocEntry: href =', ev.target.dataset.ref);
  window.rendition.display(ev.target.dataset.ref);

  ev.target
    .parentElement
    .parentElement
    .querySelectorAll('.toc-entry').forEach(function(a) {
      a.classList.remove('current')
    })

  // rendition.display is causing the class to not be added, use timeout to avoid being overriden
  window.setTimeout(function() { ev.target.classList.add('current') }, 500);

  return false;
}

function loadToC(toc) {
  const list = document.getElementById('toc');
  // const docfrag = document.createDocumentFragment();
  let a = null,
    li = null;

  console.debug('loadToC: loaded', window.book.loaded);
  console.debug('loadToC: metadata', window.book.loaded?.metadata);
  window.book.loaded?.metadata
    .then(function(data) {
      console.debug('promise: data', data);
      if (window.bookTitle) {
        window.bookTitle.textContent = data.title;
      }
    });

  toc.forEach(function(chapter) {
    a = document.createElement('a');
    li = document.createElement('li');

    a.classList.add('toc-entry');
    a.textContent = chapter.label;
    a.href = '#';
    a.dataset['ref'] = chapter.href;
    a.addEventListener('click', tocEntryClick);

    li.appendChild(a);
    list.appendChild(li);
    // docfrag.appendChild(li);
  });

  // select.appendChild(docfrag);
}

function clearToC() {
  const list = document.getElementById('toc');

  Array.from(list.children).forEach(child => list.removeChild(child));
}
