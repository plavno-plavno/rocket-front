import { expect, test } from '@e2e/support/fixtures';

test.describe('reviews inbox (S-REV-01)', () => {
  test('selects the first review, navigates with j/k, filters via URL', async ({ authed }) => {
    await authed.goto('/dashboard/reviews');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('review-detail')).toBeVisible();
    await expect(authed).toHaveURL(/review=rev_/);
    const first = authed.url();
    await authed.keyboard.press('j');
    await expect(authed).not.toHaveURL(first);
    await authed.keyboard.press('k');
    await expect(authed).toHaveURL(first);

    await main.getByRole('button', { name: /Отрицательные/ }).click();
    await expect(authed).toHaveURL(/rating=1,2/);
    await expect(main.getByTestId('review-list').locator('[data-review-id]').first()).toBeVisible();
  });

  test('publishes a reply, changes status, adds a note, sees history', async ({ authed }) => {
    await authed.goto('/dashboard/reviews?platform=plt_google&hasReply=false');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('review-detail')).toBeVisible();
    await authed.keyboard.press('r');
    const composer = main.getByTestId('reply-composer');
    await expect(composer.getByRole('textbox')).toBeFocused();
    await composer.getByRole('textbox').fill('Спасибо за отзыв!');
    await composer.getByTestId('publish-reply').click();
    await expect(authed.getByText('Ответ отправлен на публикацию')).toBeVisible();
    await expect(main.locator('[data-testid=reply][data-state=published]').first()).toBeVisible({
      timeout: 15_000
    });

    await main.getByTestId('workflow-status').click();
    await authed.getByRole('option', { name: 'Эскалирован' }).click();
    await expect(authed.getByText('Статус обновлён')).toBeVisible();

    await main.getByRole('tab', { name: /Заметки/ }).click();
    await main.getByLabel('Добавить заметку').fill('Позвонить клиенту');
    await main.getByRole('button', { name: 'Добавить заметку' }).click();
    await expect(authed.getByText('Заметка добавлена')).toBeVisible();

    await main.getByRole('tab', { name: 'История' }).click();
    await expect(main.getByText('Статус изменён')).toBeVisible();
    await expect(main.getByText('Ответ опубликован')).toBeVisible();
  });

  test('complaint dialog and manual review', async ({ authed }) => {
    await authed.goto('/dashboard/reviews?platform=plt_google&hasReply=true');
    const main = authed.locator('#main-content');
    await expect(main.getByTestId('review-detail')).toBeVisible();
    await main.getByRole('button', { name: 'Пожаловаться' }).click();
    const dialog = authed.getByTestId('complaint-dialog');
    await dialog.getByRole('radio', { name: 'Спам или реклама' }).click();
    await dialog.getByRole('button', { name: 'Отправить жалобу' }).click();
    await expect(authed.getByText('Жалоба отправлена')).toBeVisible();

    await main.getByRole('button', { name: 'Добавить отзыв' }).click();
    const manual = authed.getByTestId('manual-review-dialog');
    await manual.getByRole('button', { name: 'Выбрать компании' }).click();
    const picker = authed.getByTestId('location-picker');
    await picker.getByRole('checkbox').first().click();
    await picker.getByRole('button', { name: 'Применить' }).click();
    await manual.getByRole('combobox', { name: 'Площадка' }).click();
    await authed.getByRole('option', { name: 'Flamp' }).click();
    await manual.getByLabel('Имя автора').fill('Тестовый Клиент');
    await manual.getByLabel('Текст').fill('Отзыв, полученный лично в магазине.');
    await manual.getByRole('button', { name: 'Добавить' }).click();
    await expect(authed.getByText('Отзыв добавлен')).toBeVisible();
    await expect(main.getByTestId('review-detail')).toContainText('Тестовый Клиент');
  });

  test('observer cannot reply', async ({ browser, baseURL }) => {
    const { signInAs } = await import('@e2e/support/fixtures');
    const page = await browser.newPage();
    await signInAs(page, 'observer', 'seed_default', baseURL);
    await page.goto('/dashboard/reviews');
    await expect(page.locator('#main-content').getByTestId('review-detail')).toBeVisible();
    await expect(page.getByTestId('reply-composer')).toHaveCount(0);
    await page.close();
  });
});
