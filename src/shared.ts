const hasHistory = typeof history !== 'undefined';
const hasWindow = typeof window !== 'undefined';
const subWindow = hasWindow && window !== window.parent;

export const sideEffect = hasWindow && hasHistory && !subWindow;

export interface Prefs {
	query: {
		array: {
			separator: string
			format: 'bracket' | 'separator'
		}
		nesting: number;
		[key: string]: any;
	};
	sideEffect: boolean;
}


export const prefs: Prefs = {
	query: {
		array: {
			separator: ',',
			format: 'bracket'
		},
		nesting: 3
	},
	sideEffect
};
