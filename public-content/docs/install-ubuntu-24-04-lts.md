---
title: 安装 Ubuntu 24.04 LTS
slug: install-ubuntu-24-04-lts
tags: [Ubuntu,系统]
category: Linux
excerpt: 本文介绍如何在 Windows 环境下使用 Rufus 制作 Ubuntu 24.04 LTS 启动 U 盘，并完成 BIOS 设置、磁盘分区、系统安装及安装后的基础配置。
created: 2026-07-10
updated: 2026-07-10
status: published
featured: false
---

# 1. 在 Windows 下制作 Ubuntu 24.04 启动盘
## 1.1. 准备工作

1. 在官网上下载对应的 [Ubuntu 镜像文件](https://releases.ubuntu.com/noble/)
2. 找一个闲置且空白的 U 盘或者硬盘（ 8G 及以上）
3. 在官网下载 [rufus](https://rufus.ie/zh/)

## 1.2. 制作 Ubuntu 启动盘

打开 rufus，选择镜像文件和设备，之后点击写入即可完成安装盘制作

![rufus](/images/8cdbb0964b8af056.png)

> 此处目标机硬盘选择为GPT，大家可以在 PowerShell 中输入 Get-Disk 来查看硬盘类型

# 2. 硬盘分区

在 Windows 系统，搜索栏输入“磁盘管理”并进入

找到空闲的磁盘，点击压缩卷 **(可以利用删除卷来获取更多空间！！！注意该磁盘内所有内容将清空)** 

删除后你将获得一些空闲空间来安装 Ubuntu 系统，这个时候那些空间会变为灰色

建议为 Ubuntu 配置 200GB 的分区，避免后续因 Ubuntu 空间不足而重装系统

![rufus](/images/523e28d55a044787.png)

# 3. GPT分区形式安装方式

## 3.1. 进入BIOS

1. 关机后开机（重启）

2. 插入 Ubuntu 安装盘（之前制作好啦）

3. 进入 BIOS 

4. 寻找 `Security Boot` 选项，设置为 **`False`**

  > 非常重要！若保持默认为 True ，将导致**无法安装 CUDA 和使用外接显示屏**

5. 在 BIOS 启动启动盘中的系统


## 3.2. 安装系统



