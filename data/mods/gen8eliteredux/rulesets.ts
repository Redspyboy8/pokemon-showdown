export const Rulesets: {[k: string]: ModdedFormatData} = {
	standard: {
		inherit: true,
		ruleset: [
			'Obtainable', 'Team Preview', 'Sleep Clause Mod', 'Species Clause', 'Nickname Clause', 'OHKO Clause', 'Evasion Items Clause', 'Evasion Moves Clause', 'Endless Battle Clause', 'HP Percentage Mod', 'Cancel Mod', 'Dynamax Clause', 'Regenerator Clause', 'Seismic Toss Clause'
		],
	},
	standarddoubles: {
		inherit: true,
		ruleset: [
			'Obtainable', 'Team Preview', 'Species Clause', 'Nickname Clause', 'OHKO Clause', 'Evasion Moves Clause', 'Gravity Sleep Clause', 'Endless Battle Clause', 'HP Percentage Mod', 'Cancel Mod', 'Dynamax Clause',
		],
	},
	standardoms: {
		inherit: true,
		ruleset: [
			'Obtainable', 'Team Preview', 'Species Clause', 'Nickname Clause', 'OHKO Clause', 'Evasion Moves Clause', 'Endless Battle Clause', 'Dynamax Clause', 'HP Percentage Mod', 'Cancel Mod', 'Overflow Stat Mod',
		],
	},
	teampreview: {
		inherit: true,
		onTeamPreview() {
			this.add('clearpoke');
			for (const pokemon of this.getAllPokemon()) {
				const details = pokemon.details.replace(', shiny', '')
					.replace(/(Arceus|Greninja|Gourgeist|Pumpkaboo|Xerneas|Silvally|Urshifu|Dudunsparce)(-[a-zA-Z?-]+)?/g, '$1-*')
					.replace(/(Zacian|Zamazenta)(?!-Crowned)/g, '$1-*'); // Hacked-in Crowned formes will be revealed
				this.add('poke', pokemon.side.id, details, '');
			}
			this.makeRequest('teampreview');
		},
	},
	tiershiftmod: {
		inherit: true,
		desc: `Pok&eacute;mon below OU get their stats, excluding HP, boosted. UU/RUBL get +10, RU/NUBL get +20, NU/PUBL get +30, and PU or lower get +40.`,
		onModifySpecies(species, target, source, effect) {
			if (!species.baseStats) return;
			const boosts: {[tier: string]: number} = {
				uu: 10,
				rubl: 10,
				ru: 20,
				nubl: 20,
				nu: 30,
				publ: 30,
				pu: 40,
				nfe: 40,
				lc: 40,
			};
			let tier: string = this.toID(species.tier);
			if (!(tier in boosts)) return;
			// Non-Pokemon bans in lower tiers
			if (target) {
				if (target.set.item === 'lightclay') return;
				if (['drizzle', 'drought', 'slushrush'].includes(target.set.ability) && boosts[tier] > 20) tier = 'nubl';
			}
			const pokemon = this.dex.deepClone(species);
			pokemon.bst = pokemon.baseStats['hp'];
			const boost = boosts[tier];
			let statName: StatID;
			for (statName in pokemon.baseStats as StatsTable) {
				if (statName === 'hp') continue;
				pokemon.baseStats[statName] = this.clampIntRange(pokemon.baseStats[statName] + boost, 1, 255);
				pokemon.bst += pokemon.baseStats[statName];
			}
			return pokemon;
		},
	},
	regeneratorclause: {
		inherit: true,
		onValidateTeam(team) {
			let regenCount = 0;
			for (const set of team) {
				const species = this.dex.species.get(set.species);
				const ability = set.ability;
				const innateList = Object.keys(species.abilities)
					.filter(key => key.includes('I'))
					.map(key => species.abilities[key as 'I1' | 'I2' | 'I3'])
				const activeAbilities = [ability, ...innateList];

				if (['Regenerator'].some(a => activeAbilities.includes(a))) { 
					regenCount++;
				}
			}
			if (regenCount > 2) {
				return [`You may only have up to 2 Pokemon with Regenerator. Your team currently has ${regenCount}`];
			}
		}
	},
	seismictossclause: {
		inherit: true,
		onValidateSet(set) {
			const multihitAbilities = ['Multi Headed', 'Hyper Aggressive', 'Parental Bond'];
			const species = this.dex.species.get(set.species);
			const innateList = Object.keys(species.abilities)
				.filter(key => key.includes('I'))
				.map(key => species.abilities[key as 'I1' | 'I2' | 'I3'])
			const activeAbilities = [set.ability, ...innateList];
			for (const abilityName of activeAbilities) {
				if (abilityName && multihitAbilities.includes(abilityName) && set.moves.some(a => a === 'Seismic Toss')) {
					return [`${set.name} cannot have both Seismic Toss and ${abilityName}.`];
				}
			}
		}

	},
}