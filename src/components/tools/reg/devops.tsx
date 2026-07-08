"use client";

import { makeReg } from "./_util";
import {
  SubnetCalculator,
  CurlBuilder,
  NginxGenerator,
  KubernetesGenerator,
  GithubActionsGenerator,
  RobotsGenerator,
  EnvValidator,
  CrontabBuilder,
  BackupScriptGenerator,
  HealthCheckGenerator,
  SubnetOverlapVisualizer,
  IpAddressInfo,
  SystemdTimer,
} from "@/components/tools/impl/infra";

export default makeReg({
  "subnet-overlap-visualizer": SubnetOverlapVisualizer,
  "ip-address-info": IpAddressInfo,
  "systemd-timer-explainer": SystemdTimer,
  "ip-subnet-calculator": SubnetCalculator,
  "curl-command-builder": CurlBuilder,
  "nginx-config-generator": NginxGenerator,
  "kubernetes-yaml-generator": KubernetesGenerator,
  "github-actions-generator": GithubActionsGenerator,
  "robots-txt-generator": RobotsGenerator,
  "env-validator": EnvValidator,
  "crontab-builder": CrontabBuilder,
  "backup-script-generator": BackupScriptGenerator,
  "health-check-generator": HealthCheckGenerator,
});
