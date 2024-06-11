import {
  createBot,
  Intents,
  InteractionResponseTypes,
  startBot,
} from "https://deno.land/x/discordeno@16.0.0/mod.ts";

import exec from "./exec.ts";
import { logger } from "./logger.ts";

const channel_list = [BigInt("1091350888829943879")];

const commands = [{
  name: "help",
  description: "Print help message",
  options: [],
}, {
  name: "ping",
  description: "Retrieves the Bot latency",
  options: [],
}];

const bot = createBot({
  token: Deno.env.get("BOT_TOKEN") || "BOT_TOKEN_PLACEHOLDER",
  intents: Intents.DirectMessages | Intents.Guilds | Intents.GuildMessages |
    Intents.MessageContent,
  events: {
    async ready(bot) {
      logger.info(`Bot is ready`);
      const existing_commands = await bot.helpers
        .getGlobalApplicationCommands();
      for (const command of commands) {
        if (existing_commands.find((cmd) => cmd.name == command.name)) continue;
        bot.helpers.createGlobalApplicationCommand(command);
        logger.info(`Command ${command.name} created`);
      }
    },
    interactionCreate(bot, interaction) {
      const command = interaction.data?.name;
      logger.info(`Interaction: ${command}`);
      switch (command) {
        case "help":
          return bot.helpers.sendInteractionResponse(
            interaction.id,
            interaction.token,
            {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: {
                content: "```md\n# Help\n\n" +
                  "- Use code block to send code\n" +
                  "- Supported languages: c, cpp, lua\n" +
                  "- Direct message is allowed(check privacy setting)\n" +
                  "```",
              },
            },
          );
        case "ping":
          return bot.helpers.sendInteractionResponse(
            interaction.id,
            interaction.token,
            {
              type: InteractionResponseTypes.ChannelMessageWithSource,
              data: { content: "🏓 Pong!" },
            },
          );
      }
    },
    async messageCreate(bot, message) {
      const content = message.content;
      if (message.isFromBot) return;
      if (message.guildId && !channel_list.includes(message.channelId)) return;

      if (content.startsWith("```")) {
        const lines = content.split("\n");
        const lang = lines[0].substring(3);
        const code = lines.slice(1, lines.length - 1).join("\n");
        const result = await exec(code, lang);
        try {
          await bot.helpers.sendMessage(message.channelId, {
            content: "here is the result: ```\n" +
              result.replaceAll("`", "\`") +
              "\n```",
            messageReference: {
              messageId: message.id,
              channelId: message.channelId,
              guildId: message.guildId,
              failIfNotExists: true,
            },
          });
        } catch (err) {
          logger.error(err);
        }
      }
    },
  },
});
startBot(bot);
