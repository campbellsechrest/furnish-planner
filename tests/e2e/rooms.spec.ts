import { test, expect } from '@playwright/test';

test.describe('Rooms - create, select, move, resize, labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?e2e=1');
  });

  test('create room, move and resize it, labels update', async ({ page }) => {
    // Select room tool
    await page.getByTestId('tool-room').click();

    const canvas = page.getByTestId('floorplan-canvas');
    const box = await canvas.boundingBox();
    if (!box) throw new Error('Canvas not found');

    // Draw a room
    const start = { x: box.x + 200, y: box.y + 200 };
    const end = { x: box.x + 420, y: box.y + 340 };
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    await page.mouse.move(end.x, end.y, { steps: 10 });
    await page.mouse.up();

    // Verify a room exists
    const roomsCount = await page.evaluate(() => (window as any).__fp?.getRooms()?.length ?? 0);
    expect(roomsCount).toBe(1);

    const initial = await page.evaluate(() => (window as any).__fp.getFirstRoomBounds());
    expect(initial).not.toBeNull();

    // Switch to select tool
    await page.getByTestId('tool-select').click();

    // Drag the room by ~120x60
    await page.mouse.move(initial.left + box.x + initial.width / 2, initial.top + box.y + initial.height / 2);
    await page.mouse.down();
    await page.mouse.move(initial.left + box.x + initial.width / 2 + 120, initial.top + box.y + initial.height / 2 + 60, { steps: 10 });
    await page.mouse.up();

    const moved = await page.evaluate(() => (window as any).__fp.getFirstRoomBounds());
    expect(moved.left - initial.left).toBeGreaterThan(60);
    expect(moved.top - initial.top).toBeGreaterThan(30);

    // Click to ensure selection and controls visible
    await page.mouse.click(moved.left + box.x + moved.width / 2, moved.top + box.y + moved.height / 2);

    // Resize from bottom-right corner by +60/+60
    const br = { x: moved.left + box.x + moved.width - 2, y: moved.top + box.y + moved.height - 2 };
    await page.mouse.move(br.x, br.y);
    await page.mouse.down();
    await page.mouse.move(br.x + 60, br.y + 60, { steps: 10 });
    await page.mouse.up();

    const resized = await page.evaluate(() => (window as any).__fp.getFirstRoomBounds());
    expect(resized.width).toBeGreaterThan(moved.width + 30);
    expect(resized.height).toBeGreaterThan(moved.height + 30);

    // Labels exist and update
    const labels = await page.evaluate(() => (window as any).__fp.getDimensionLabelsForFirstRoom());
    expect(labels).not.toBeNull();
    expect(labels.width).toMatch(/\d+(\.\d+)?'/);
    expect(labels.height).toMatch(/\d+(\.\d+)?'/);
  });
});
