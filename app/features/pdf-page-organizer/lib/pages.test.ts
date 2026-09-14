import { describe, expect, it } from 'vitest';
import {
  createPages,
  deletePages,
  isEdited,
  keepOnly,
  movePage,
  normalizeAngle,
  reversePages,
  rotatePages,
} from './pages';

const pages = (rotations = [0, 0, 0, 0]) =>
  createPages(rotations, (index) => `p${index}`);

const ids = (list: { id: string }[]) => list.map((page) => page.id);

describe('normalizeAngle', () => {
  it('brings any angle into 0/90/180/270', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(450)).toBe(90);
    expect(normalizeAngle(-90)).toBe(270);
    expect(normalizeAngle(-450)).toBe(270);
  });

  it('rounds an angle a PDF should not have had to the nearest quarter turn', () => {
    expect(normalizeAngle(89)).toBe(90);
    expect(normalizeAngle(46)).toBe(90);
  });
});

describe('createPages', () => {
  it('starts every page where the document already had it', () => {
    const list = createPages([0, 90, 270], (index) => `p${index}`);
    expect(list.map((page) => page.rotation)).toEqual([0, 90, 270]);
    expect(list.map((page) => page.baseRotation)).toEqual([0, 90, 270]);
    expect(list.map((page) => page.sourceIndex)).toEqual([0, 1, 2]);
  });
});

describe('rotatePages', () => {
  it('adds to the angle the page already had', () => {
    const list = createPages([90], () => 'p0');
    expect(rotatePages(list, ['p0'], 90)[0]!.rotation).toBe(180);
  });

  it('turns left by wrapping round to 270', () => {
    const list = rotatePages(pages(), ['p0'], -90);
    expect(list[0]!.rotation).toBe(270);
  });

  it('comes back to where it started after four turns', () => {
    let list = pages();
    for (let i = 0; i < 4; i += 1) {
      list = rotatePages(list, ['p0'], 90);
    }
    expect(list[0]!.rotation).toBe(0);
  });

  it('touches only the pages it was given', () => {
    const list = rotatePages(pages(), ['p1', 'p3'], 90);
    expect(list.map((page) => page.rotation)).toEqual([0, 90, 0, 90]);
  });

  it('leaves the list alone when nothing is selected', () => {
    const list = pages();
    expect(rotatePages(list, [], 90)).toBe(list);
  });
});

describe('movePage', () => {
  it('moves a page forwards and backwards', () => {
    expect(ids(movePage(pages(), 0, 2))).toEqual(['p1', 'p2', 'p0', 'p3']);
    expect(ids(movePage(pages(), 3, 1))).toEqual(['p0', 'p3', 'p1', 'p2']);
  });

  it('refuses to move past either end', () => {
    const list = pages();
    expect(movePage(list, 0, -1)).toBe(list);
    expect(movePage(list, 3, 4)).toBe(list);
    expect(movePage(list, 1, 1)).toBe(list);
  });
});

describe('deletePages and keepOnly', () => {
  it('drops the pages it was given', () => {
    expect(ids(deletePages(pages(), ['p1', 'p2']))).toEqual(['p0', 'p3']);
  });

  it('keeps the source page numbers of what is left', () => {
    const left = deletePages(pages(), ['p0', 'p1']);
    expect(left.map((page) => page.sourceIndex)).toEqual([2, 3]);
  });

  it('keeps only the selection, in list order rather than selection order', () => {
    expect(ids(keepOnly(pages(), ['p3', 'p1']))).toEqual(['p1', 'p3']);
  });

  it('can empty the list, which the UI stops at', () => {
    expect(deletePages(pages(), ['p0', 'p1', 'p2', 'p3'])).toEqual([]);
  });
});

describe('reversePages', () => {
  it('reverses without touching the original array', () => {
    const list = pages();
    expect(ids(reversePages(list))).toEqual(['p3', 'p2', 'p1', 'p0']);
    expect(ids(list)).toEqual(['p0', 'p1', 'p2', 'p3']);
  });
});

describe('isEdited', () => {
  it('is false for a document nobody has touched', () => {
    expect(isEdited(pages(), 4)).toBe(false);
  });

  it('notices a deletion, a reorder, and a rotation', () => {
    expect(isEdited(deletePages(pages(), ['p0']), 4)).toBe(true);
    expect(isEdited(movePage(pages(), 0, 1), 4)).toBe(true);
    expect(isEdited(rotatePages(pages(), ['p0'], 90), 4)).toBe(true);
  });

  it('is false when a page is turned all the way back', () => {
    const list = rotatePages(rotatePages(pages(), ['p0'], 90), ['p0'], -90);
    expect(isEdited(list, 4)).toBe(false);
  });
});
