// Root: runs once when the app starts, where inject() works.
export default () => {
  document.documentElement.dataset['root'] = 'yes';
};
