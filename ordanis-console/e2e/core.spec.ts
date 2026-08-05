import { expect, test } from '@playwright/test'

test('opens workflow console and builder', async ({ page }) => {
  await page.goto('/console/workflows')
  await expect(page.getByRole('heading', { name: 'Workflows' })).toBeVisible()
  await page.getByRole('link', { name: 'Create workflow' }).click()
  await expect(page.getByRole('button', { name: 'Visual DAG' })).toBeVisible()
})

test('opens a fixture execution', async ({ page }) => {
  await page.goto('/console/executions')
  await page.locator('tbody a').first().click()
  await expect(page.getByText('Live execution graph')).toBeVisible()
})
