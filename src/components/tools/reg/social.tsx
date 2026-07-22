"use client";

import { makeReg } from "./_util";
import { MultiStyler, SingleStyler, AestheticUsername, SmallTextGenerator, GlitchTextGenerator } from "@/components/tools/impl/text-styler";
import { CharacterCounter } from "@/components/tools/impl/text";
import { PLATFORM_LIMITS } from "@/lib/social-tools";
import {
  WhatsAppLink, HashtagCounter, InstagramLineBreak, YouTubeThumbnail, SocialImageSizes, EmojiPicker,
} from "@/components/tools/impl/social";
import {
  FakeTweet, FakeInstagram, InstagramBio, TwitterBio, CaptionGenerator, HashtagGenerator,
  SocialPreviewTester, FakeFacebook, FakeInstagramDm, TweetToImage,
} from "@/components/tools/impl/social-mock";
import { YouTubeTagExtractor } from "@/components/tools/impl/social-extra";

export default makeReg({
  "instagram-font-generator": () => (
    <MultiStyler defaultText="your bio text" charLimit={PLATFORM_LIMITS.bioInstagram.chars} platformLabel="Instagram bio" />
  ),
  "discord-font-generator": () => <MultiStyler defaultText="discord text" charLimit={32} platformLabel="Discord" />,
  "twitch-text-generator": () => <MultiStyler defaultText="twitch name" charLimit={25} platformLabel="Twitch username" />,
  "linkedin-text-formatter": () => (
    <MultiStyler styleNames={["Bold (Serif)", "Italic", "Bold Italic", "Bold Sans", "Underline", "Strikethrough"]} defaultText="LinkedIn post" charLimit={3000} platformLabel="LinkedIn" />
  ),
  "bold-text-generator": () => <SingleStyler styleName="Bold (Serif)" />,
  "cursive-text-generator": () => <SingleStyler styleName="Script" />,
  "strikethrough-text-generator": () => <SingleStyler styleName="Strikethrough" />,
  "glitch-text-generator": GlitchTextGenerator,
  "small-text-generator": SmallTextGenerator,
  "upside-down-text-generator": () => <SingleStyler styleName="Upside Down" />,
  "aesthetic-username-generator": AestheticUsername,
  "twitter-character-counter": CharacterCounter,
  "whatsapp-link-generator": WhatsAppLink,
  "hashtag-counter": HashtagCounter,
  "instagram-line-break-generator": InstagramLineBreak,
  "youtube-thumbnail-downloader": YouTubeThumbnail,
  "social-media-image-sizes": SocialImageSizes,
  "emoji-picker": EmojiPicker,
  "fake-tweet-generator": FakeTweet,
  "tweet-to-image": TweetToImage,
  "fake-instagram-post-generator": FakeInstagram,
  "instagram-bio-generator": InstagramBio,
  "twitter-bio-generator": TwitterBio,
  "instagram-caption-generator": CaptionGenerator,
  "instagram-hashtag-generator": () => <HashtagGenerator platform="Instagram" />,
  "tiktok-hashtag-generator": () => <HashtagGenerator platform="TikTok" />,
  "social-preview-tester": SocialPreviewTester,
  "fake-facebook-post-generator": FakeFacebook,
  "fake-instagram-dm-generator": FakeInstagramDm,
  "youtube-tag-extractor": YouTubeTagExtractor,
});
