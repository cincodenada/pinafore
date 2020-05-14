import { favoriteStatusAs, postAs, postReplyAs, reblogStatusAs } from '../serverActions'
import { loginAsFoobar } from '../roles'
import {
  getAriaSetSize,
  getFavoritesCount,
  getNthStatus,
  getNthStatusContent,
  getReblogsCount,
  getUrl,
  goBack,
  sleep
} from '../utils'

fixture`132-threads-and-updates.js`
  .page`http://localhost:4002`

test('thread for a status that is not cached locally', async t => {
  const { id: statusId } = await postAs('baz', 'yo here is a post you have never seen before')
  await postReplyAs('baz', 'yep you have never seen this', statusId)
  await loginAsFoobar(t)
  await t
    .navigateTo(`/statuses/${statusId}`)
    .expect(getNthStatusContent(1).innerText).contains('you have never seen before')
    .expect(getNthStatusContent(2).innerText).contains('yep you have never')
})

test('thread for a reply that is not cached locally', async t => {
  const { id: statusId } = await postAs('baz', 'number one')
  const { id: replyId } = await postReplyAs('baz', 'number two', statusId)
  await loginAsFoobar(t)
  await t
    .navigateTo(`/statuses/${replyId}`)
    .expect(getNthStatusContent(1).innerText).contains('number one')
    .expect(getNthStatusContent(2).innerText).contains('number two')
})

test('thread for a status that is cached but the rest is not', async t => {
  const { id: id1 } = await postAs('foobar', 'post number one')
  const { id: id2 } = await postReplyAs('baz', 'post number two', id1)
  await postReplyAs('baz', 'post number three', id2)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatusContent(1).innerText).contains('post number one')
    .click(getNthStatus(1))
    .expect(getUrl()).contains('/statuses')
    .expect(getNthStatusContent(1).innerText).contains('post number one')
    .expect(getNthStatusContent(2).innerText).contains('post number two')
    .expect(getNthStatusContent(3).innerText).contains('post number three')
})

test('thread for a reply that is cached but the rest is not', async t => {
  const { id: id1 } = await postAs('baz', 'post number one')
  const { id: id2 } = await postReplyAs('baz', 'post number two', id1)
  await postReplyAs('foobar', 'post number three', id2)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatusContent(1).innerText).contains('post number three')
    .click(getNthStatus(1))
    .expect(getUrl()).contains('/statuses')
    .expect(getNthStatusContent(1).innerText).contains('post number one')
    .expect(getNthStatusContent(2).innerText).contains('post number two')
    .expect(getNthStatusContent(3).innerText).contains('post number three')
})

test('updates the status fav/reblog count when you click on status', async t => {
  const { id } = await postAs('foobar', 'my happy happy post')
  await loginAsFoobar(t)

  async function assertReblogAndFavCount (reblogs, favs) {
    await t
      .expect(getReblogsCount()).eql(reblogs)
      .expect(getFavoritesCount()).eql(favs)
  }

  await t.click(getNthStatus(1))
  await assertReblogAndFavCount(0, 0)
  await goBack()
  await favoriteStatusAs('baz', id)
  await sleep(1000)
  await t.click(getNthStatus(1))
  await assertReblogAndFavCount(0, 1)
  await goBack()
  await reblogStatusAs('baz', id)
  await sleep(1000)
  await t.click(getNthStatus(1))
  await assertReblogAndFavCount(1, 1)
})

test('updates the thread when you click on status', async t => {
  const { id } = await postAs('foobar', 'my super happy post')
  await loginAsFoobar(t)
  await t
    .click(getNthStatus(1))
    .expect(getAriaSetSize()).eql('1')
  await goBack()
  const { id: id2 } = await postReplyAs('baz', 'that is very happy', id)
  await t
    .click(getNthStatus(1))
    .expect(getAriaSetSize()).eql('2')
    .expect(getNthStatusContent(2).innerText).contains('that is very happy')
  await goBack()
  await postReplyAs('baz', 'that is super duper happy', id2)
  await t
    .click(getNthStatus(1))
    .expect(getAriaSetSize()).eql('3')
    .expect(getNthStatusContent(3).innerText).contains('super duper happy')
  await goBack()
})

test('updates the thread of a reply when you click on it', async t => {
  const { id: id1 } = await postAs('baz', 'uno')
  const { id: id2 } = await postReplyAs('foobar', 'dos', id1)
  await loginAsFoobar(t)
  await t
    .expect(getNthStatusContent(1).innerText).contains('dos')
    .click(getNthStatus(1))
    .expect(getAriaSetSize()).eql('2')
    .expect(getNthStatusContent(1).innerText).contains('uno')
    .expect(getNthStatusContent(2).innerText).contains('dos')
  await goBack()
  const { id: id3 } = await postReplyAs('baz', 'tres', id2)
  await t
    .click(getNthStatus(1))
    .expect(getAriaSetSize()).eql('3')
    .expect(getNthStatusContent(3).innerText).contains('tres')
  await goBack()
  await postReplyAs('baz', 'quatro', id3)
  await t
    .click(getNthStatus(1))
    .expect(getAriaSetSize()).eql('4')
    .expect(getNthStatusContent(4).innerText).contains('quatro')
  await goBack()
})