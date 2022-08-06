import {
	type ApplicationCommandOptionChoiceData,
	type ApplicationCommandType,
	type Attachment,
	type AutocompleteInteraction,
	type Awaitable,
	type Channel,
	type ChatInputCommandInteraction,
	type GuildMember,
	Locale,
	type MessageContextMenuCommandInteraction,
	type RESTPostAPIApplicationCommandsJSONBody,
	type Role,
	type User,
	type UserContextMenuCommandInteraction,
	APIApplicationCommandSubcommandOption,
} from 'discord.js';
import i18next from 'i18next';

interface InteractionTypeMapping {
	[ApplicationCommandType.ChatInput]: ChatInputCommandInteraction<'cached'>;
	[ApplicationCommandType.User]: UserContextMenuCommandInteraction<'cached'>;
	[ApplicationCommandType.Message]: MessageContextMenuCommandInteraction<'cached'>;
}

export type CommandBody<Type extends ApplicationCommandType> = RESTPostAPIApplicationCommandsJSONBody & {
	type: Type;
};

export interface Command<Type extends ApplicationCommandType = ApplicationCommandType> {
	readonly containsSubcommands: false;
	readonly interactionOptions: CommandBody<Type>;
	handleAutocomplete?: (interaction: AutocompleteInteraction<any>) => Awaitable<ApplicationCommandOptionChoiceData[]>;
	handle: (interaction: InteractionTypeMapping[Type]) => Awaitable<unknown>;
}

export interface CommandWithSubcommands {
	readonly containsSubcommands: true;
	readonly interactionOptions: Omit<CommandBody<ApplicationCommandType.ChatInput>, 'options'>;
	handleAutocomplete?: (interaction: AutocompleteInteraction<any>) => Awaitable<ApplicationCommandOptionChoiceData[]>;
}

// As of right now, strict typings for the subcommand parameter requires extending SubcommandData
export interface Subcommand
	extends Omit<Command<ApplicationCommandType.ChatInput>, 'interactionOptions' | 'containsSubcommands'> {
	readonly interactionOptions: Omit<APIApplicationCommandSubcommandOption, 'type'>;
}

export type SubcommandData = Record<string, AllowedInteractionOptionTypes>;

export type AllowedInteractionOptionTypes =
	| string
	| number
	| boolean
	| User
	| Channel
	| Role
	| GuildMember
	| Attachment;

export type CommandConstructor = new (...args: any[]) => Command | CommandWithSubcommands;

// PropAsIndexSignature and PropAsIndexSignatureLocalizations are separate because
// TS does not allow 2 index signatures
type PropAsIndexSignature<T extends string> = {
	[P in T]: string;
};
// This needs to be is own type, otherwise TS does not allow applying this within an index signature
type StringAsLocalizations<T extends string> = `${T}_localizations`;
type PropAsIndexSignatureLocalizations<T extends string> = {
	[P in StringAsLocalizations<T>]: Record<Locale, string>;
};

type LocalizedProp<T extends string> = PropAsIndexSignature<T> & PropAsIndexSignatureLocalizations<T>;

export function getLocalizedProp<Prop extends string>(prop: Prop, key: string) {
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	return {
		[prop]: i18next.t(key),
		[`${prop}_localizations`]: Object.fromEntries(
			Object.values(Locale).map((locale) => [locale, i18next.t(key, { lng: locale })]),
		),
	} as LocalizedProp<Prop>;
}
