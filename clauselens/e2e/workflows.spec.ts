import {test,expect} from '@playwright/test';
test('workflow tabs switch between answering and Nemotron semantic modeling',async({page})=>{
 await page.goto('/');const nav=page.getByRole('navigation',{name:'ClauseLens workflows'});
 await expect(nav.getByRole('link',{name:/Ask a question/})).toHaveAttribute('aria-current','page');
 await nav.getByRole('link',{name:/Build the semantic layer/}).click();await expect(page).toHaveURL(/\/builder$/);await expect(page.getByRole('button',{name:'Generate with Nemotron'})).toBeEnabled({timeout:20000});
 await expect(page.getByRole('navigation',{name:'ClauseLens workflows'}).getByRole('link',{name:/Build the semantic layer/})).toHaveAttribute('aria-current','page');
 await page.getByRole('navigation',{name:'ClauseLens workflows'}).getByRole('link',{name:/Ask a question/}).click();await expect(page.getByRole('button',{name:'Ask ClauseLens',exact:true})).toBeEnabled();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
