# Student workflow: client demonstration

## Using phones, tablets, and desktops

- On phones, the bottom navigation contains Home, Search, My Activity, and Updates. Open My Activity to find reports and ownership requests; requests needing a reply or ready for collection appear first. Help and Log out are in Account.
- Search keeps the keyword field visible and puts optional fields under Filters on phones. Applied filter labels can be removed individually without clearing the other filters.
- Item grids use one column on phones, two on medium screens, and three on wide screens. Item details stack on narrow screens. Progress becomes a vertical timeline on phones.
- Updates shows an unread count. Open an update's report/request link for its current status, then use Mark as read to clear that update from the count. Refresh to check for new updates.
- Review the selected photo in the last report step before submitting. Upload and saving messages show that work is in progress. Bottom navigation hides while a form input has focus on phones, and form actions stay in the document so they do not cover the on-screen keyboard.
- Staff use a menu drawer on phones, a collapsible sidebar on tablets, and the full sidebar on wide screens. Ownership reviews become labeled cards on narrower screens, with the same review form and validation as the desktop table.
- Navy, gold, white, and light gray remain the main colors. Current progress uses navy and gold; statuses retain written labels. Keyboard focus, a skip link, larger touch controls, and reduced-motion preferences are supported.

The student portal now includes visible report/request progress, possible-match links, an Updates page, a Help page, report editing/closure, and private replies to staff. Updates are checked by refreshing the page; there is no promise of email or push delivery.

## Before demonstrating

- Use an existing verified student account, a second verified account for the finder, and an administrator account. Registering still requires a matching active school master-list record.
- Start the API and web app with `npm run dev`, or use their deployed URLs.
- Confirm category/location seed data and the existing photo upload storage policy are installed.
- In `apps/web/.env.local`, optionally set `LOST_FOUND_OFFICE`, `LOST_FOUND_EMAIL`, `LOST_FOUND_PHONE`, and `LOST_FOUND_HOURS`; restart the web app. The office defaults to `CBEA Faculty Office`. Use the same `LOST_FOUND_OFFICE` value in the API so approval notifications and the Help page always agree. No phone, email, or hours are invented.

## Demonstration sequence

1. **Student: report a missing item.** Choose I lost something, search, then Report my missing item. Fill out the three steps. Put identifying clues in the private field. Review and submit.
2. **Show progress.** Open Items I reported. The progress indicator shows the current stage and explains the next step.
3. **Finder: submit the found item.** Use the second account and matching category, color, location, and a nearby date. A report alone does not confirm physical custody; arrange handover with staff.
4. **Student: view the match.** Open Updates, then Items I reported and the report details. Open a possible match and compare it. Select This might be mine and submit private ownership details.
5. **Administrator: request more information.** In Claims, choose Ask for more information, write a specific question, and save the decision.
6. **Student: reply.** Open My ownership requests, read the staff note, and send additional details. The request returns to Under review.
7. **Administrator: approve collection.** Review the original ownership answer and additional replies. Approve and optionally write collection instructions.
8. **Student: arrange collection.** The request shows Ready to collect. Help and the contact card explain where to ask staff and to bring a school ID.
9. **Administrator: record handover.** After checking the school ID and handing over the item, choose Record collection and confirm the handover. The student sees Collected and the found report shows Returned.
10. **Show corrections.** On another report that is still open or matched, open its details and edit the description or close the report. Closed reports remain in the owner's history. Reports under ownership review cannot be edited or closed by the reporter.

A student's separate missing-item report is not automatically closed by collecting a found item: match suggestions alone do not establish which missing report was resolved. The student can close that report from its details.

## What to check during acceptance

### Admin report workspace

- Open a report to see its contextual **Next step**, compact summary, and available matches. Expand **Compare items side by side** to compare category, color, location, date, and description.
- For a lost report, confirm that you compared a suggested found item before selecting **Notify student of possible match**. This sends an in-app Updates message, not an email and not an ownership approval. Repeating the same invitation does not send another message.
- If private identifying details are missing, **Request identifying details** sends the reporter a link to edit their report. Only open/matched reports can receive these actions.
- **Ownership requests for this case** shows requests on this found report, or this lost-report owner's requests on suggested found reports. Review decisions here; **View all requests** opens the full queue.
- Reserved, returned, and archived matches are separated from available suggestions. Returned items cannot be offered for collection again.
- **Case history** combines submission dates with recorded notification and claim-review events. A related collection does not automatically close a separate lost report.
- Verify narrow/mobile layouts, comparison disclosure, pending/error feedback, and student Updates links with test accounts before live acceptance. Automated message tests use mocks and do not notify real students.

- Opening report API routes without a bearer token returns 401.
- A finder cannot request their own item. Items under review or already returned do not offer the ownership form.
- A second request submitted from a stale page receives an explanation, without creating another active claim.
- Other students cannot see private identifying details or an owner's match list. Archived reports are restricted to their owner and administrators.
- Asking for information or rejecting a claim requires an explanation. Collection requires prior approval. Completed decisions cannot be silently reopened.
- Registration connection errors, duplicate-account conflicts, reset-link feedback, and password-update failures are visible.
- Selecting/removing a photo before submission does not upload it. Photos upload only when submitting; failed submissions attempt to remove unreferenced uploads.
- Check desktop and mobile layouts and the complete workflow using the configured Supabase project before presenting it as live acceptance-tested.

## Photo maintenance

Interrupted uploads and legacy abandoned photos can be cleaned using:

```bash
npm run photos:cleanup --workspace=@lost-found/database
# Review the dry-run count, then apply when appropriate:
npm run photos:cleanup --workspace=@lost-found/database -- --apply
```

The task only targets report photos older than 24 hours that are not referenced by a report, processes at most 500 per run, and rechecks references under the same lock used by report attachment. Schedule the apply command daily in the deployment environment if automatic cleanup is required. The implementation task does not run this deletion or install a scheduler.

Report photos remain public by design. Private ownership answers and private report details must never be placed in these images.
