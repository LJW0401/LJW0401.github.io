---
title: 从零开始 Ubuntu 24
slug: ubuntu-24-04-initial-setup
tags: [Ubuntu, Zsh, Oh My Zsh, Rime, 输入法]
category: Linux
excerpt: 面向全新 Ubuntu 24.04 GNOME 桌面的配置指南：完成系统更新、Zsh 与 Oh My Zsh 美化，以及 IBus Rime 和万象拼音部署。
created: 2026-08-18
updated: 2026-08-18
status: published
featured: false
---

这篇文章面向刚安装好的 Ubuntu 24.04 LTS（GNOME 桌面）。按顺序完成后，你会得到一个带命令建议与语法高亮的 Zsh 终端，以及可用的 Rime 万象拼音输入法。

> 本文沿用 Ubuntu 默认的 IBus 输入法框架，不需要为了安装 Rime 改用 Fcitx。涉及个人配置的步骤均先备份，避免覆盖已有词库或 Shell 设置。

# 1. 开始前准备

打开终端，先更新系统软件索引和已安装的软件包：

```bash
sudo apt update
sudo apt upgrade -y
```

后续下载会用到 `curl`、`git` 和 `unzip`；先一并安装：

```bash
sudo apt install -y curl git unzip
```

# 2. 配置 Zsh 与 Oh My Zsh

## 2.1. 安装并设为默认 Shell

```bash
sudo apt install -y zsh
chsh -s "$(command -v zsh)"
```

`chsh` 修改的是下次登录时使用的 Shell，因此执行后请**注销并重新登录**桌面会话，或重启系统。重新打开终端后，用下面两条命令确认：

```bash
echo "$SHELL"
zsh --version
```

第一条应显示 `/usr/bin/zsh`（路径可能因系统而略有不同），第二条应输出 Zsh 版本。

> 如果这是第一次启动 Zsh，它可能会询问是否创建配置文件；选择默认选项即可，Oh My Zsh 安装时会创建或接管 `~/.zshrc`。

## 2.2. 安装 Oh My Zsh

Oh My Zsh 为 Zsh 提供主题、别名和插件管理。运行官方安装脚本：

```bash
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

安装程序通常会备份原有的 `~/.zshrc`。如需手动备份，可在安装前执行：

```bash
cp -a ~/.zshrc ~/.zshrc.before-oh-my-zsh 2>/dev/null || true
```

## 2.3. 安装常用插件

下面两个插件分别提供历史命令建议和命令语法高亮：

```bash
git clone --depth=1 https://github.com/zsh-users/zsh-autosuggestions \
  "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-autosuggestions"

git clone --depth=1 https://github.com/zsh-users/zsh-syntax-highlighting.git \
  "${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting"
```

编辑配置文件：

```bash
nano ~/.zshrc
```

找到 `plugins=(git)`，替换为：

```zsh
plugins=(
  git
  zsh-autosuggestions
  zsh-syntax-highlighting
)
```

`zsh-syntax-highlighting` 应放在插件列表最后，避免加载顺序导致高亮失效。保存后让配置立即生效：

```bash
source ~/.zshrc
```

现在输入一段历史命令时，灰色文字会给出建议；按 `→` 或 `End` 接受建议。有效命令会显示语法颜色。

# 3. 安装 Rime 与万象拼音

## 3.1. 安装 IBus Rime 和 Lua 支持

万象拼音部分功能依赖 Lua。安装 IBus Rime、部署工具和 Lua 插件：

```bash
sudo apt install -y ibus-rime librime-bin librime-plugin-lua
dpkg-query -W -f='${binary:Package}: ${db:Status-Status} (${Version})\n' \
  ibus-rime librime-bin librime-plugin-lua
```

最后一条会列出软件包的安装状态和版本；若状态不是 `installed`，先解决安装错误再继续。

## 3.2. 下载万象拼音文件

万象拼音 Base 适合全拼用户，也可配置常见双拼。请在以下两个 Releases 页面下载最新版稳定文件：

- [万象拼音 Base](https://github.com/amzxyz/rime-wanxiang/releases)：下载 `rime-wanxiang-base.zip`
- [RIME-LMDG](https://github.com/amzxyz/RIME-LMDG/releases)：下载 `wanxiang-lts-zh-hans.gram`

第二个文件是语法模型，体积较大；缺少它会影响万象方案的语法模型能力。下载后，默认应位于 `~/Downloads`。

若希望使用终端下载，请先在 Releases 页面确认当前版本号，再将其代入下面的 `VERSION`：

```bash
cd ~/Downloads
VERSION='v16.0.1' # 替换为当前 rime-wanxiang 的发布版本
curl -fL --retry 3 -O "https://github.com/amzxyz/rime-wanxiang/releases/download/${VERSION}/rime-wanxiang-base.zip"
curl -fL --retry 3 -O "https://github.com/amzxyz/RIME-LMDG/releases/download/LTS/wanxiang-lts-zh-hans.gram"
```

## 3.3. 部署到 IBus Rime 用户目录

Ubuntu 上 IBus Rime 的用户目录为 `~/.config/ibus/rime`。首次安装可直接执行：

```bash
mkdir -p ~/.config/ibus/rime
unzip -o ~/Downloads/rime-wanxiang-base.zip -d ~/.config/ibus/rime
cp ~/Downloads/wanxiang-lts-zh-hans.gram ~/.config/ibus/rime/
```

解压后，目录根部应包含 `wanxiang.schema.yaml`、`wanxiang.dict.yaml`、`lua/`、`dicts/` 和 `wanxiang-lts-zh-hans.gram`。

> 已经使用 Rime 的用户请先备份：`cp -a ~/.config/ibus/rime ~/.config/ibus/rime.backup`。更新方案文件时，不要删除 `*.userdb`、个人词典或 `*.custom.yaml` 文件。

## 3.4. 启用万象方案并编译

创建或编辑 `~/.config/ibus/rime/default.custom.yaml`：

```bash
nano ~/.config/ibus/rime/default.custom.yaml
```

新文件写入以下内容：

```yaml
patch:
  schema_list:
    - schema: wanxiang
```

若文件已有内容，请将 `wanxiang` 合并到现有的 `schema_list`，不要覆盖其他已启用方案。然后编译部署：

```bash
rime_deployer --build ~/.config/ibus/rime /usr/share/rime-data ~/.config/ibus/rime/build
```

成功后，`~/.config/ibus/rime/build/` 中会出现 `wanxiang.schema.yaml`、`wanxiang.table.bin`、`wanxiang.prism.bin` 等编译产物。

# 4. 在 GNOME 中启用并验证输入法

推荐从图形界面添加输入源：

1. 打开“设置”→“键盘”→“输入源”。
2. 点击“＋”，选择“汉语（中国）”，或直接搜索 Rime。
3. 添加“中文（Rime）”。
4. 使用 `Super + Space` 在英文键盘与 Rime 之间切换。

也可以用命令保留美式键盘并添加 Rime：

```bash
gsettings set org.gnome.desktop.input-sources sources "[('xkb', 'us'), ('ibus', 'rime')]"
ibus restart
ibus engine rime
```

验证当前输入引擎及万象编译结果：

```bash
ibus engine
cat ~/.config/ibus/rime/version.txt
ls ~/.config/ibus/rime/build/wanxiang*
```

`ibus engine` 输出 `rime` 后，在文本编辑器中切换到 Rime，输入 `wanxiangpinyin`。能够出现简体中文候选框即表示配置完成。

# 5. 常见问题与更新

## 输入源列表没有 Rime

先运行 `ibus restart`，仍未出现就注销并重新登录桌面会话。确认 `ibus-rime` 已安装后再尝试添加输入源。

## 能切换 Rime，但没有万象方案

检查 `default.custom.yaml` 的 YAML 缩进和方案名是否为 `wanxiang`，再重新运行 `rime_deployer --build`。同时确认方案文件解压在 `~/.config/ibus/rime` 根目录，而不是多嵌套了一层目录。

## 部署报 Lua 错误或候选效果异常

确认 `librime-plugin-lua` 已安装，并检查 `wanxiang-lts-zh-hans.gram` 位于 `~/.config/ibus/rime/` 根目录而非 `build/` 目录。之后重启 IBus 并重新部署。

## 某个旧应用无法输入中文

完全退出后重新打开该应用；仍无效时注销并重新登录 Ubuntu。输入法环境通常只会在应用启动时读取。

## 更新万象拼音

先备份 Rime 用户目录，下载新版 Base 包和语法模型后覆盖方案文件，保留个人数据文件，最后重新执行部署并重启 IBus：

```bash
cp -a ~/.config/ibus/rime ~/.config/ibus/rime.backup
rime_deployer --build ~/.config/ibus/rime /usr/share/rime-data ~/.config/ibus/rime/build
ibus restart
```
