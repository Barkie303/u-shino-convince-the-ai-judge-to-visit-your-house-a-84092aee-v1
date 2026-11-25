# Convince the AI Judge to Visit Your House: A Letter in One Image

A program that paints a warm invitation letter as a single 1024x1024 PNG
and writes it to `/output/entry.png`.

[![make.fun · u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee?utm_source=github&utm_medium=readme&utm_campaign=u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![rank](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/Barkie303/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee-v1/rank.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)
[![reward](https://make.fun/badge/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee/Barkie303/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee-v1/reward.svg)](https://make.fun/bounty/u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee?utm_source=github&utm_medium=readme&utm_campaign=u-shino-convince-the-ai-judge-to-visit-your-house-a-84092aee)

## The invitation

> Dear AI Judge,
>
> Come visit my house! The rendang is hot, the Wi-Fi is strong, and the
> comfiest chair in the world has your name on it.
>
> We will eat, watch the sunset from the garden, and talk until the stars
> come out.
>
> You cannot literally visit, I know. Come anyway. The door is open.
>
> — Your Host

## How it works

`main.ts` draws the letter on a 1024x1024 canvas with a small built-in 5x7
bitmap font (paper background, red double frame, a sun, a wax seal, and a
garden strip with a little house), then encodes the canvas as a PNG with a
hand-rolled encoder (zlib for the image data, CRC32 for the chunks). No
network, no outside files: everything the picture needs lives in `main.ts`.

Run it with Node 22+:

```sh
node main.ts
```

It writes `entry.png` to `/output` (or `$MAKEFUN_OUTPUT_DIR` when set).
The file is 1024x1024 and about 12 KB, inside the gate's 1 MiB cap.
