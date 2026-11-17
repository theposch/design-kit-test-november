// A made-up grocery app the size of a real project, for trying the flow view
// on: 63 screens in 8 parts, with ways back, things that go wrong, and many
// moves from one part into another. In the shape prototype.json uses.

const m = (to, label) => ({ to, label });
const back = (to, label = 'Back') => ({ to, label, back: true });
const bad = (to, label) => ({ to, label, problem: true });

const flows = [
  ['Welcome', [
    ['splash', 'Splash', [m('welcome', 'Get started')]],
    ['welcome', 'Welcome', [m('sign-up', 'Create account'), m('sign-in', 'Sign in')]],
    ['sign-up', 'Create account', [m('verify', 'Continue'), back('welcome')]],
    ['verify', 'Enter code', [m('allow-alerts', 'Verify'), bad('code-expired', 'Verify'), back('sign-up')]],
    ['code-expired', 'Code expired', [m('verify', 'Send a new code')]],
    ['allow-alerts', 'Allow notifications', [m('home', 'Allow'), m('home', 'Not now')]],
    ['sign-in', 'Sign in', [m('home', 'Sign in'), bad('wrong-password', 'Sign in'), m('forgot', 'Forgot password?'), back('welcome')]],
    ['wrong-password', 'Wrong password', [m('home', 'Sign in'), m('forgot', 'Reset password')]],
    ['forgot', 'Reset password', [m('reset-sent', 'Send link'), back('sign-in')]],
    ['reset-sent', 'Check your email', [m('sign-in', 'Back to sign in')]],
  ]],
  ['Home', [
    ['home', 'Home', [m('search', 'Search'), m('category', 'Fresh produce'), m('promo', 'Weekly offers'), m('alerts', 'Bell'), m('location', 'Deliver to'), m('cart', 'Cart'), m('account', 'Account')]],
    ['category', 'Category', [m('product', 'Bananas'), m('filters', 'Filter'), back('home')]],
    ['promo', 'Weekly offers', [m('product', 'Add'), back('home')]],
    ['alerts', 'Notifications', [m('order', 'Order on its way'), back('home')]],
    ['location', 'Deliver to', [m('home', 'Use this address'), bad('location-denied', 'Use my location'), m('address-new', 'Add address')]],
    ['location-denied', 'Location is off', [m('location', 'Enter address')]],
  ]],
  ['Search', [
    ['search', 'Search', [m('results', 'Search'), m('scan', 'Scan a barcode'), back('home', 'Cancel')]],
    ['results', 'Results', [m('product', 'Oat milk'), m('filters', 'Filter'), bad('no-results', 'Search'), back('search')]],
    ['filters', 'Filters', [m('results', 'Show results'), back('results', 'Close')]],
    ['no-results', 'No results', [m('search', 'Try another search'), m('help', 'Ask for help')]],
    ['scan', 'Scan barcode', [m('product', 'Scan'), bad('scan-failed', 'Scan'), back('search', 'Close')]],
    ['scan-failed', 'Could not read code', [m('scan', 'Try again'), m('search', 'Type it instead')]],
  ]],
  ['Product', [
    ['product', 'Product', [m('cart', 'Add to cart'), m('photos', 'Photo'), m('reviews', 'Reviews'), m('list-add', 'Save to list'), bad('sold-out', 'Add to cart'), back('results')]],
    ['photos', 'Photos', [back('product', 'Close')]],
    ['reviews', 'Reviews', [m('review-write', 'Write a review'), back('product')]],
    ['review-write', 'Write a review', [m('reviews', 'Post'), back('reviews', 'Cancel')]],
    ['list-add', 'Save to list', [m('product', 'Done'), m('lists', 'See lists')]],
    ['sold-out', 'Sold out', [m('product', 'Notify me'), m('results', 'See similar')]],
  ]],
  ['Checkout', [
    ['cart', 'Cart', [m('address', 'Check out'), m('promo-code', 'Add promo code'), m('product', 'Oat milk'), bad('cart-empty', 'Remove'), back('home', 'Keep shopping')]],
    ['cart-empty', 'Cart is empty', [m('home', 'Start shopping')]],
    ['promo-code', 'Promo code', [m('cart', 'Apply'), bad('promo-invalid', 'Apply'), back('cart', 'Cancel')]],
    ['promo-invalid', 'Code not valid', [m('promo-code', 'Try another')]],
    ['address', 'Delivery address', [m('slot', 'Continue'), m('address-new', 'Add address'), back('cart')]],
    ['address-new', 'New address', [m('address', 'Save'), back('address', 'Cancel')]],
    ['slot', 'Delivery time', [m('payment', 'Continue'), bad('slot-gone', 'Continue'), back('address')]],
    ['slot-gone', 'Time no longer free', [m('slot', 'Pick another time')]],
    ['payment', 'Payment', [m('order-review', 'Continue'), m('card-add', 'Add card'), back('slot')]],
    ['order-review', 'Review order', [m('placed', 'Place order'), bad('declined', 'Place order'), back('payment')]],
    ['declined', 'Card declined', [m('payment', 'Use another card'), m('order-review', 'Try again')]],
    ['placed', 'Order placed', [m('track', 'Track order'), m('home', 'Done')]],
  ]],
  ['Orders', [
    ['orders', 'Orders', [m('order', 'Order #2291'), back('account')]],
    ['order', 'Order details', [m('track', 'Track'), m('return-items', 'Return items'), m('chat', 'Get help'), back('orders')]],
    ['track', 'Track order', [bad('late', 'Refresh'), m('chat', 'Contact driver'), back('order')]],
    ['late', 'Running late', [m('track', 'OK'), m('chat', 'Get help')]],
    ['return-items', 'Choose items', [m('return-reason', 'Continue'), back('order', 'Cancel')]],
    ['return-reason', 'Why return?', [m('return-done', 'Submit'), back('return-items')]],
    ['return-done', 'Return booked', [m('orders', 'Done')]],
  ]],
  ['Account', [
    ['account', 'Account', [m('profile', 'Profile'), m('orders', 'Orders'), m('lists', 'Lists'), m('addresses', 'Addresses'), m('cards', 'Payment methods'), m('prefs', 'Preferences'), m('help', 'Help'), m('signed-out', 'Sign out'), back('home', 'Close')]],
    ['profile', 'Profile', [m('account', 'Save'), m('delete', 'Delete account'), back('account')]],
    ['lists', 'Lists', [m('list', 'Weekly shop'), back('account')]],
    ['list', 'List', [m('product', 'Bananas'), m('cart', 'Add all to cart'), back('lists')]],
    ['addresses', 'Addresses', [m('address-new', 'Add address'), back('account')]],
    ['cards', 'Payment methods', [m('card-add', 'Add card'), back('account')]],
    ['card-add', 'Add card', [m('cards', 'Save'), bad('card-invalid', 'Save'), back('cards', 'Cancel')]],
    ['card-invalid', 'Card not accepted', [m('card-add', 'Edit card')]],
    ['prefs', 'Preferences', [back('account')]],
    ['delete', 'Delete account', [m('signed-out', 'Delete'), back('profile', 'Cancel')]],
    ['signed-out', 'Signed out', [m('welcome', 'Sign in again')]],
  ]],
  ['Help', [
    ['help', 'Help', [m('article', 'Delivery fees'), m('chat', 'Chat with us'), m('callback', 'Request a call'), back('account')]],
    ['article', 'Help article', [m('chat', 'Still need help?'), back('help')]],
    ['chat', 'Chat', [bad('chat-offline', 'Send'), back('help', 'Close')]],
    ['chat-offline', 'Chat is offline', [m('callback', 'Request a call'), m('help', 'Back to help')]],
    ['callback', 'Request a call', [m('help', 'Done'), back('help', 'Cancel')]],
  ]],
];

/** The screens, as a prototype.json lists them. */
export const screens = flows.flatMap(([group, list]) => list.map(([id, title, next]) => ({ id, title, group, next })));
