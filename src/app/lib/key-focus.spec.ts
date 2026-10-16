import { dropMouseFocus, pressesControl } from './key-focus';

describe('pressesControl', () => {
  const button = document.createElement('button');
  const inner = document.createElement('span');
  button.append(inner);
  const div = document.createElement('div');

  it('is true for Space and Enter on a button or inside one', () => {
    expect(pressesControl({ key: ' ', target: button })).toBe(true);
    expect(pressesControl({ key: 'Enter', target: inner })).toBe(true);
  });
  it('is false for other keys and other elements', () => {
    expect(pressesControl({ key: 'ArrowRight', target: button })).toBe(false);
    expect(pressesControl({ key: ' ', target: div })).toBe(false);
    expect(pressesControl({ key: ' ', target: null })).toBe(false);
  });
  it('counts a link and a role="menuitem" element', () => {
    const link = Object.assign(document.createElement('a'), { href: 'https://example.com/' });
    const item = document.createElement('div');
    item.setAttribute('role', 'menuitem');
    expect(pressesControl({ key: 'Enter', target: link })).toBe(true);
    expect(pressesControl({ key: ' ', target: item })).toBe(true);
  });
});

describe('dropMouseFocus', () => {
  function focused() {
    const button = document.createElement('button');
    document.body.append(button);
    button.focus();
    return button;
  }
  it('blurs a button after a mouse click', () => {
    const button = focused();
    dropMouseFocus({ detail: 1, target: button });
    expect(document.activeElement).not.toBe(button);
    button.remove();
  });
  it('keeps the focus after a keyboard click', () => {
    const button = focused();
    dropMouseFocus({ detail: 0, target: button });
    expect(document.activeElement).toBe(button);
    button.remove();
  });
});
