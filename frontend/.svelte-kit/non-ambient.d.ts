
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/dao" | "/dao/[id]" | "/dao/[id]/proposal" | "/dao/[id]/proposal/[proposalId]";
		RouteParams(): {
			"/dao/[id]": { id: string };
			"/dao/[id]/proposal": { id: string };
			"/dao/[id]/proposal/[proposalId]": { id: string; proposalId: string }
		};
		LayoutParams(): {
			"/": { id?: string; proposalId?: string };
			"/dao": { id?: string; proposalId?: string };
			"/dao/[id]": { id: string; proposalId?: string };
			"/dao/[id]/proposal": { id: string; proposalId?: string };
			"/dao/[id]/proposal/[proposalId]": { id: string; proposalId: string }
		};
		Pathname(): "/" | "/dao" | "/dao/" | `/dao/${string}` & {} | `/dao/${string}/` & {} | `/dao/${string}/proposal` & {} | `/dao/${string}/proposal/` & {} | `/dao/${string}/proposal/${string}` & {} | `/dao/${string}/proposal/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): string & {};
	}
}