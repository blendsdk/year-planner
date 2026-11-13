# Print

The component renders a hidden A3 tree; the browser print dialog produces one to
three landscape pages for a 12–36 month window.

| Window | Paginate | Fit |
| --- | --- | --- |
| 12–14 months | 1 page | 1 page |
| 15–28 months | 2 pages | 1 page |
| 29–36 months | 3 pages | 1 page, with `PRINT_FIT_TOO_SMALL` when text drops below 7 pt |

## Live print stories

- [14 months, paginate](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-06-print-planning--paginate-fourteen-months)
- [24 months, paginate](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-06-print-planning--paginate-twenty-four-months)
- [36 months, paginate](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-06-print-planning--paginate-thirty-six-months)
- [14 months, fit](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-06-print-planning--fit-fourteen-months)
- [24 months, fit](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-06-print-planning--fit-twenty-four-months)
- [PRT-01 reference](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-06-print-planning--prt-01-two-thousand-seventeen)
- [Print theme](https://blendsdk.github.io/year-planner/storybook/?path=/story/year-planner-06-print-planning--print-theme)

## Print contract

- Page size is A3 landscape (420 × 297 mm).
- Month labels, weekends, ISO weeks, ribbons, annotations and metadata are
  preserved.
- Selection fills and focus rings are not printed.
- Hidden items stay hidden.
- The print tree is hidden on screen and does not affect the interactive grid.

The Playwright print matrix generates real Chromium PDFs and checks the page
size and extracted text with `pdfinfo` and `pdftotext`.

## Try it

Open a print story, press `Ctrl`/`Cmd` + `P`, and choose **Save as PDF**. Or use
the `print` button in your own host. See
[Print an A3 plan](../tutorials/print-a3-plan.md) for the host CSS.
