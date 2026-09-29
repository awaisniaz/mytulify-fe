"use client";

import { makeReg } from "./_util";
import { ContentCreatorTextToSpeech } from "@/components/tools/impl/content-creator";
import { OnlineVideoEditor } from "@/components/tools/impl/video-editor";
import { VideoScriptStudio } from "@/components/tools/impl/video-script-studio";

export default makeReg({
  "online-video-editor": OnlineVideoEditor,
  "video-script-studio": VideoScriptStudio,
  "text-to-speech": ContentCreatorTextToSpeech,
});
