const fs = require('fs');
const cheerio = require('cheerio') //for html testing
const inlineCss = require('inline-css'); //for css testing

//include custom matchers
const styleMatchers = require('jest-style-matchers');
expect.extend(styleMatchers);

const htmlPath = __dirname + '/index.html';
const html = fs.readFileSync(htmlPath, 'utf-8'); //load the HTML file once
const cssPath = __dirname + '/css/style.css';
const css = fs.readFileSync(cssPath, 'utf-8'); //load the HTML file once

//absolute path for relative loading (if needed)
const baseDir = 'file://'+__dirname+'/';

describe('Source code is valid', () => {
  test('HTML validates without errors', async () => {
    const lintOpts = {
      'attr-bans':['align', 'background', 'bgcolor', 'border', 'frameborder', 'marginwidth', 'marginheight', 'scrolling', 'style', 'width', 'height'], //adding height, allow longdesc
      'doctype-first':true,
      'doctype-html5':true,
      'html-req-lang':true,
      'attr-name-style': false, //for meta tags
      'line-end-style':false, //either way
      'indent-style':false, //can mix/match
      'indent-width':false, //don't need to beautify
      'line-no-trailing-whitespace': false, //don't need to beautify
      'id-class-style':false, //I like dashes in classnames
      'img-req-alt':true
    }

    await expect(htmlPath).toHaveNoHtmlLintErrorsAsync(lintOpts);
  })

  test('CSS validates without errors', async () => {
    await expect(cssPath).toHaveNoCssLintErrorsAsync();
  })
});

describe('Implements cards with Flexbox', () => {
  let $; //cheerio instance

  beforeAll(async () => {
    //test CSS by inlining properties and then reading them from cheerio
    let inlined = await inlineCss(html, {extraCss: css, url:baseDir, removeLinkTags:false});
    $ = cheerio.load(inlined);
    // console.log(inlined);
  })

  test('1. Uses Flexbox to create 3-column layout', () => {
    expect($('body').css('box-sizing')).toEqual('border-box');

    let flexContainer = $('main > div');
    expect(flexContainer.length).toBe(1); //includes container div
    expect(flexContainer.children('section').length).toBe(3); //sections are childen of div

    expect(flexContainer.css('display')).toEqual('flex');

    let flexItems = flexContainer.children('section');
    expect(flexItems.eq(0).css('flex-basis')).toEqual('240px'); //first column basis
    expect(flexItems.eq(1).css('flex')).toEqual('1'); //second column flex
    expect(flexItems.eq(1).css('background-color').toLowerCase()).toEqual('#eee')
    expect(flexItems.eq(2).css('flex-basis')).toEqual('180px');
    expect(flexItems.eq(2).css('flex-shrink')).toEqual('0');

    expect(flexItems.css('padding')).toEqual('1em');
  })

  test('2. Uses Flexbox to create "cards"', () => {

    let cardContainer = $('section').eq(1).children('div');
    expect(cardContainer.length).toBe(1); //includes container div
    expect(cardContainer.find('img').length).toBe(5); //contains the 5 images

    expect(cardContainer.css('display')).toEqual('flex');
    expect(cardContainer.css('flex-wrap')).toEqual('wrap');
    expect(cardContainer.css('justify-content')).toEqual('center');

    let cardItems = cardContainer.children('div');
    expect(cardItems.length).toBe(5); //contains 5 "card" divs

    cardItems.each((i, cardDiv) => {
      expect($(cardDiv).children('img').length).toBe(1); //each card div contains an img
      expect($(cardDiv).children('p').length).toBe(1); //each card div contains a paragraph
    })

    expect(cardItems.css('flex')).toEqual('0 0 250px');
    expect(cardItems.css('background-color')).toEqual('white');
    expect(cardItems.css('margin')).toEqual('.5rem');
  })

  test('3. Cards have appropriate styling', () => {

    let cardItems = $('section').eq(1).children('div').children('div');

    expect(cardItems.children('p').css('padding')).toEqual('.5rem 1rem');

    expect(cardItems.css('border-radius')).toEqual('10px');

    let boxShadowNoSpaces = cardItems.css('box-shadow').replace(/\s+/g,'');
    expect(boxShadowNoSpaces).toEqual('01px3pxrgba(0,0,0,0.16),01px3pxrgba(0,0,0,0.23)');
  })

  test('4. Columns stretch to the bottom of the page', () => {
    
    let body = $('body');
    expect(body.css('display')).toEqual('flex');
    expect(body.css('flex-direction')).toEqual('column');

    let main = $('main');
    expect(main.css('flex')).toEqual('1');

    let html = $('html');
    expect(html.css('height')).toEqual('100%');
    expect(body.css('height')).toEqual('inherit');
    let flexContainer = $('main > div');
    expect(flexContainer.css('height')).toEqual('100%');
  })
});
