// google-chrome --headless --disable-gpu --screenshot --window-size=1280,1696 http://localhost
// google-chrome --headless --remote-debugging-port=9222
const CDP = require('chrome-remote-interface');
const fs = require('fs');
const settings = require('./settings');

const format = 'png';
const viewportWidth = 900;
const viewportHeight = 600;
const delay = 10000;
const userAgent;
const fullPage;

async function takeScreenshot(feedback_id) {
    var url = 'http://localhost/feedback/'+feedback_id;
    console.log(url);
    
    // Start the Chrome Debugging Protocol
    await new Promise(async resolve => {
        await CDP(async function(client) {
          // Extract used DevTools domains.
          const {DOM, Emulation, Network, Page, Runtime} = client;
        
          // Enable events on domains we are interested in.
          await Page.enable();
          await DOM.enable();
          await Network.enable();
        
          // If user agent override was specified, pass to Network domain
          if (userAgent) {
            await Network.setUserAgentOverride({userAgent});
          }
        
          // Set up viewport resolution, etc.
          const deviceMetrics = {
            width: viewportWidth,
            height: viewportHeight,
            deviceScaleFactor: 0,
            mobile: false,
            fitWindow: false,
          };
          await Emulation.setDeviceMetricsOverride(deviceMetrics);
          await Emulation.setVisibleSize({width: viewportWidth, height: viewportHeight});
        
          // Navigate to target page
          await Page.navigate({url});
        
          // Wait for page load event to take screenshot
          Page.loadEventFired(async () => {
            // If the `full` CLI option was passed, we need to measure the height of
            // the rendered page and use Emulation.setVisibleSize
            if (fullPage) {
              const {root: {nodeId: documentNodeId}} = await DOM.getDocument();
              const {nodeId: bodyNodeId} = await DOM.querySelector({
                selector: 'body',
                nodeId: documentNodeId,
              });
              const {model: {height}} = await DOM.getBoxModel({nodeId: bodyNodeId});
        
              await Emulation.setVisibleSize({width: viewportWidth, height: height});
              // This forceViewport call ensures that content outside the viewport is
              // rendered, otherwise it shows up as grey. Possibly a bug?
              await Emulation.forceViewport({x: 0, y: 0, scale: 1});
            }
        
            setTimeout(async function() {
              const screenshot = await Page.captureScreenshot({format});
              const buffer = new Buffer(screenshot.data, 'base64');
              console.log(feedback_id);
              filename = 'screenshot'+feedback_id+'.png';
              filepath = settings.schoology_data_dir+filename;
              fs.writeFile(filepath, buffer, 'base64', function(err) {
                if (err) {
                  console.error(err);
                } else {
                  console.log('Screenshot saved');
                }
                client.close();
                resolve(filepath);
              });
            }, delay);
          });
        }).on('error', err => {
          console.error('Cannot connect to browser:', err);
        });
    })
}
module.exports = {
    takeScreenshot: takeScreenshot
}
