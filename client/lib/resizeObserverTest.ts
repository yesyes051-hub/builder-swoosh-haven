/**
 * Simple utility to test ResizeObserver error suppression
 * This can be called from the browser console to verify the suppression is working
 */

export const testResizeObserverSuppression = (): void => {
  console.log('🧪 Testing ResizeObserver error suppression...');

  // Test 1: Try to trigger a ResizeObserver error through console.error
  console.log('Test 1: Console error suppression');
  console.error('ResizeObserver loop completed with undelivered notifications.');
  console.log('✅ If you see this but not the error above, console suppression is working');

  // Test 2: Try to trigger through window error event
  console.log('Test 2: Window error event suppression');
  const errorEvent = new ErrorEvent('error', {
    message: 'ResizeObserver loop limit exceeded',
    filename: 'test.js',
    lineno: 1
  });
  window.dispatchEvent(errorEvent);
  console.log('✅ Window error event test completed');

  // Test 3: Create a fake ResizeObserver to test patching
  console.log('Test 3: ResizeObserver patching test');
  if (window.ResizeObserver) {
    try {
      const testObserver = new ResizeObserver(() => {
        throw new Error('ResizeObserver test error');
      });
      
      // Create a test element
      const testDiv = document.createElement('div');
      testDiv.style.width = '100px';
      testDiv.style.height = '100px';
      document.body.appendChild(testDiv);
      
      // Observe the element
      testObserver.observe(testDiv);
      
      // Trigger a resize
      testDiv.style.width = '200px';
      
      // Clean up
      setTimeout(() => {
        testObserver.unobserve(testDiv);
        document.body.removeChild(testDiv);
        console.log('✅ ResizeObserver patching test completed');
      }, 100);
      
    } catch (error) {
      console.log('❌ ResizeObserver patching may not be working:', error);
    }
  } else {
    console.log('ℹ️ ResizeObserver not available in this browser');
  }

  console.log('🎯 ResizeObserver suppression test completed. Check above for any errors that should have been suppressed.');
};

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).testResizeObserverSuppression = testResizeObserverSuppression;
}
