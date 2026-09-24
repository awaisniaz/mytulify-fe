"use client";

import { makeReg } from "./_util";
import { ContentCreatorTextToSpeech } from "@/components/tools/impl/content-creator";
import { OnlineVideoEditor } from "@/components/tools/impl/video-editor";

export default makeReg({
  "online-video-editor": OnlineVideoEditor,
  "text-to-speech": ContentCreatorTextToSpeech,
});
