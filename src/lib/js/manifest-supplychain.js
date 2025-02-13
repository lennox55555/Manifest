class ManifestSupplyChain {
	constructor() {
		this.measures = [{measure: 'weight', unit: 'kg'}, {measure: 'co2e', unit: 'kg'}, {measure: 'water', unit: 'kl'},
		{measure: 'energy', unit: 'kj'}, {measure: 'cost', unit: 'dollars'}, {measure: 'percent', unit: '%'}];
		this.linetypes = { greatcircle: 'GREAT_CIRCLE_LINE', bezier: 'BEZIER_LINE', straight: 'STRAIGHT_LINE' };
	}
	/** Setup the supply chain rendering by adding it to the user interface */
	Setup(d) {	
		const index = MI.supplychains.push(d)-1, id = d.details.id;
		const defs = 	{ 
							type: 'FeatureCollection', 
							properties: { title: 'Supply Chain', description: ''}, 
							graph: { links: [], nodes: [] } 
						};	
		d.properties = Object.assign(defs.properties, d.properties); d.graph = Object.assign(defs.graph, d.graph);
		this.SetupStyle(d);
		
		let mheader = document.createElement('div');
		mheader.id = 'mheader-'+id; mheader.classList.add('mheader', 'scref-'+d.details.id);
		let fillcolor = d.details.style.fillColor, textcolor = d.details.style.textColor;		
		let url = d.details.url.split('#')[0]+window.location.search+'#'+d.details.url.split('#')[1];
		
		mheader.innerHTML = `
		<div class="mtitle" style="background: ${fillcolor}; color: ${textcolor};">
			<i id="menumap-${id}" class="menumap fas fa-globe-${d.details.globe}"></i><a href="${url}">${d.properties.title}</a>
			<i id="closemap-${id}" class="fas fa-times-circle closemap" style="color: ${textcolor};"></i>
		</div>`;
						
		let mdetails = document.createElement('div');
		mdetails.id = 'mdetails-'+id; mdetails.classList.add('mdetails');
		mdetails.innerHTML = `<div class="mdescription">${ManifestUtilities.Linkify(d.properties.description)}</div>`;
	
		let mlist = document.createElement('ul');
		mlist.id = 'mlist-'+id; mlist.classList.add('mlist');
	
		document.getElementById('manifestlist').append(mheader,mdetails,mlist);	
		
		document.getElementById('mheader-'+id).addEventListener('click', (e, nodeid=id) => { MI.Interface.ShowHeader(nodeid); });
		document.getElementById('closemap-'+id).addEventListener('click', (e, nodeid=id) => { MI.Supplychain.Remove(nodeid); });
		
		let supplycatmap = {}, supplycats = {};
		for (let ft of d.features) {
			if (ft.geometry.type === 'Point') {
				if (ft.properties.category) { for (let cat of ft.properties.category.split(',')) {
					if (cat !== '') {
						supplycatmap[String(cat)] = true;
					}
				}}
			}
		}
		
		let supplycat = document.createElement('div');
		supplycat.id = 'supplycat-'+id; supplycat.classList.add('supplycatgroup');
		supplycat.innerHTML = `<span class="supplyrow"><label for="chain-${id}" class="supplycatheader"><input type="checkbox" id="chain-${id}" value="chain-${id}" checked><span class="chaincheckmark"><i class="fas"></i></span> ${d.properties.title}</label><span id="supplytoggle-${id}" class="supplytoggle plus"><i class="fas fa-plus-circle"></i></span></span>`;
		document.getElementById('supplycategories').append(supplycat);	
		
		document.getElementById('supplytoggle-'+id).addEventListener('click', (e) => { 
			document.getElementById('supplycatsub-'+id).classList.toggle('closed');
			document.getElementById('supplytoggle-'+id).classList.toggle('plus');
			
			//if (el.checked) { this.Hide(el.value.split('-')[1], false, el.value.split('-')[0]);}
			//else { this.Hide(el.value.split('-')[1], true, el.value.split('-')[0]); } 
		});
		
		let supplycatsub = document.createElement('div');
		supplycatsub.id = 'supplycatsub-'+id; supplycatsub.classList.add('supplycatsub', 'closed'); 
		
		supplycatsub.innerHTML += 
			`<span class="supplyrow"><label id="nodeheader-${id}" for="nodes-${id}" class="nodelineheader nodes"><input id="nodes-${id}" type="checkbox" value="nodes-${id}" checked><span class="nodelinecheckmark"><i class="fas"></i></span> Nodes for ${d.properties.title}</label></span>`;
		supplycatsub.innerHTML += 
			`<span class="supplyrow"><label id="lineheader-${id}" for="lines-${id}" class="nodelineheader lines"><input id="lines-${id}" type="checkbox" value="lines-${id}" checked><span class="nodelinecheckmark"><i class="fas"></i></span> Lines for ${d.properties.title} </label></span>`;
		
		// TODO: Shouldn't show this if all nodes are categorized. 
		if (Object.entries(supplycatmap).length > 1) {
			supplycatsub.innerHTML += `<span class="supplyrow"><label for="cat-${id}-uncategorized" class="supplycat"><input id="cat-${id}-uncategorized" type="checkbox" value="cat-${id}-uncategorized" checked><span class="supplycatcheckmark"><i class="fas"></i></span> Uncategorized Nodes</label></span>`;			
		}	 
		for (const [key, value] of Object.entries(supplycatmap)) {
			supplycatsub.innerHTML += `<span class="supplyrow"><label for="cat-${id}-${key}" class="supplycat"><input id="cat-${id}-${key}" type="checkbox" value="cat-${id}-${key}" checked><span class="supplycatcheckmark"><i class="fas"></i></span> ${key}</label></span>`;
			supplycats[key] = [];
		}
		supplycatsub.innerHTML += '</span>';
		MI.supplychains[index].categories = supplycats;
		document.getElementById('supplycat-'+id).append(supplycatsub);	
	
		document.getElementById('supplycat-'+id).querySelectorAll('.supplycatheader input').forEach(el => { el.addEventListener('click', (e) => { 
			if (el.checked) { this.Hide(el.value.split('-')[1], false, el.value.split('-')[0]);}
			else { this.Hide(el.value.split('-')[1], true, el.value.split('-')[0]); } });
		});
		document.getElementById('supplycat-'+id).querySelectorAll('.nodelineheader input').forEach(el => { el.addEventListener('click', (e) => { 
			if (el.checked) { this.Hide(el.value.split('-')[1], false, el.value.split('-')[0]);}
			else { this.Hide(el.value.split('-')[1], true, el.value.split('-')[0]); } });
		});
		document.getElementById('supplycat-'+id).querySelectorAll('.supplycat input').forEach(el => { el.addEventListener('click', (e) => { 
			MI.Interface.filter.clear = false;
			MI.Interface.Search(document.getElementById('searchbar').value, true);
		});});
		
		document.getElementById('manifestlist').querySelectorAll('#mdetails-'+id+',#mlist-'+id).forEach(el => { MI.Interface.observer.observe(el); });
		
		// Finalize UI
		let moffset = 0; document.getElementById('manifestlist').querySelectorAll('.mheader').forEach(el => { if (el.style.display !== 'none') { el.style.top = moffset+'px'; moffset += el.offsetHeight; }});		
		let roffset = 0; Array.from(document.getElementById('manifestlist').querySelectorAll('.mheader')).reverse().forEach(el => { if (el.style.display !== 'none') { el.style.bottom = roffset+'px'; roffset += el.offsetHeight;}});
		
		if (document.getElementById('searchbar').value !== '' || document.getElementById('supplycategories').querySelectorAll('.supplycat input:not(:checked)').length > 0) { 
			MI.Interface.ClearSearch(); MI.Interface.Search(); 
		}
			
		if (MI.Interface.IsMobile()) { MI.Interface.Mobilify(id, index); }
		MI.Interface.SetDocumentTitle();
	
		return index;
	}

	/** Setup the supply chain map **/
	Map(index) {
		let d = MI.supplychains[index];
		let points = {type: 'FeatureCollection', features:[] }, lines = {type: 'FeatureCollection', features:[] }, arrows = {type: 'FeatureCollection', features:[] };
		let nodelist = [];
		
		for (let [i, ft] of d.features.entries()) {
			const defs = { type: 'Feature', properties: { lid: d.details.id * 10000 + Number(i), mindex: Number(i)+1, title: 'Node', description: '', placename: '', category: '', images: '', icon: '', color: '', measures: [], sources: '', notes: '', clustered: [], latlng: '', hidden: false}, geometry: { type: 'Point', coordinates: [] } };
					   
			ft = { type: 'Feature', properties: Object.assign(defs.properties, ft.properties), geometry: Object.assign(defs.geometry, ft.geometry) };			
			for (let p of ['description','placename','category','images','icon','sources']) { if (typeof ft.properties[p] === 'undefined') { ft.properties[p] = '';}}
	
			const expandedProperties = { categories: ft.properties.category.split(',') };	
			if (ft.properties.images.length === 1 && ft.properties.images[0].URL === '') { ft.properties.images = []; }				
			ft.properties = Object.assign(ft.properties, expandedProperties);
			ft.properties.placename = (ft.properties.placename !== '') ? ft.properties.placename : (ft.properties.address ? ft.properties.address : ''); 
			
			if (d.mapper) { 
				if (ft.properties.index) { d.mapper[Number(ft.properties.index-1)] = ft; } // manifest
				else { d.mapper['map'+ft.properties.placename.replace(/[^a-zA-Z0-9]/g, '') + ft.properties.title.replace(/[^a-zA-Z0-9]/g, '')] = ft; } // smap
			}
			if (ft.geometry.type === 'Point') { 
				let pointblob = this.SetupPoint(ft, d, index); nodelist.push(pointblob.li); points.features.push(pointblob.ft);
			} else { 
				let line = MI.options.simpleLines ? this.SetupSimpleLine(ft, d, index) : this.SetupLine(ft, d, index); 
					
				if (line !== false) {
					let arrow = MI.options.simpleLines ? 
						this.SetupSimpleArrow(JSON.parse(JSON.stringify(line)), d, index) : this.SetupArrow(JSON.parse(JSON.stringify(line)), d, index);
					lines.features.push(line); arrows.features.push(arrow);
				}
			}	
		}
		document.getElementById('mlist-'+d.details.id).innerHTML = nodelist.join('');
		
		document.getElementById('mlist-'+d.details.id).querySelectorAll('.cat-link').forEach(el => { el.addEventListener('click', (e) => {  MI.Interface.Search(el.textContent); e.stopPropagation(); }); });	
		document.getElementById('mlist-'+d.details.id).querySelectorAll('li').forEach(el => { el.addEventListener('click', (e) => {  MI.Atlas.PointFocus(el.id.substring(6)); }); });
		document.getElementById('mdetails-'+d.details.id).querySelectorAll('.manifest-link').forEach(el => { el.addEventListener('click', (e) => {  MI.Interface.Link(el.href, e); }); });
		document.getElementById('mlist-'+d.details.id).querySelectorAll('.manifest-link').forEach(el => { el.addEventListener('click', (e) => {  MI.Interface.Link(el.href, e); }); });	
		document.getElementById('mlist-'+d.details.id).querySelectorAll('.sources').forEach(el => { el.addEventListener('click', (e) => { e.stopPropagation(); }); });	
		document.getElementById('mlist-'+d.details.id).querySelectorAll('.images-display-left').forEach(el => { el.addEventListener('click', (e) => { e.stopPropagation(); MI.Interface.ImageScroll(el.id.split('_').pop(), -1); }); });	
		document.getElementById('mlist-'+d.details.id).querySelectorAll('.images-display-right').forEach(el => { el.addEventListener('click', (e) => { e.stopPropagation(); MI.Interface.ImageScroll(el.id.split('_').pop(), 1); }); });	
		document.getElementById('mlist-'+d.details.id).querySelectorAll('.images-spot').forEach(el => { el.addEventListener('click', (e) => { e.stopPropagation(); MI.Interface.ImageScroll(e.currentTarget.dataset.lid, 0, e.currentTarget.dataset.index); }); });	
		document.getElementById('mlist-'+d.details.id).querySelectorAll('.ftimg').forEach(el => { el.addEventListener('click', (e) => { 
				e.stopPropagation();
				document.getElementById('full-modal').style.backgroundImage = 'url('+el.src+')';
				document.getElementById('fullscreen-modal').classList.toggle('closed');
		});});

		if (lines.features.length === 0) { document.querySelectorAll('.nodelineheader.lines').forEach(el => { 
			let inputs = el.querySelectorAll('input');
			for (let inp of inputs) { if (inp.value.split('-')[1] === String(d.details.id)) { el.remove(); } }
		}); }	

		for (let i in lines.features) { 
			for (let j in points.features) {
				if (typeof lines.features[i].properties.connections !== 'undefined') { 
					if (lines.features[i].properties.connections.from.scid === points.features[j].properties.scid && 
						lines.features[i].properties.connections.from.index === points.features[j].properties.mindex) {
						lines.features[i].properties.connections.from = arrows.features[i].properties.connections.from = points.features[j];
					} 
					else if (lines.features[i].properties.connections.to.scid === points.features[j].properties.scid && 
						lines.features[i].properties.connections.to.index === points.features[j].properties.mindex) {
						lines.features[i].properties.connections.to = arrows.features[i].properties.connections.to = points.features[j];
					} 
				}
			}
		}	
		// Prepare to add layers
		let maplayergroup =  L.layerGroup();
				
		let lineLayer = new L.geoJSON(lines, { style: MI.Atlas.styles.line });	
		d.details.layers.push(maplayergroup.addLayer(lineLayer));		

		let arrowLayer = new L.geoJSON(arrows, { onEachFeature: MI.Atlas.RenderLine, pointToLayer: function (feature, latlng) { 
			MI.Atlas.styles.arrow.rotation = feature.properties.angle;
			return L.triangleMarker(latlng, MI.Atlas.styles.arrow);
		} });
		d.details.layers.push(maplayergroup.addLayer(arrowLayer));	
		
		// Setup Pointlayer
		for (let i in points.features) { 
			for (let j in points.features) { 	
				if (i !== j && points.features[i].properties.latlng.equals(points.features[j].properties.latlng)) { 
					points.features[i].properties.clustered.push(points.features[j]); 
				} 
			}
		}	
		for (let i in points.features) { 
			for (let j in MI.Atlas.map._layers) { 
				if (MI.Atlas.map._layers[j].feature && MI.Atlas.map._layers[j].feature.properties.clustered) {
					if (points.features[i].properties.latlng.equals(MI.Atlas.map._layers[j]._latlng)) { 
						points.features[i].properties.clustered.push(MI.Atlas.map._layers[j].feature);	
						MI.Atlas.map._layers[j].feature.properties.clustered.push(points.features[i]);
					}
				 }
			}
		}	
	
		let pointLayer = new L.geoJSON(points, { onEachFeature: MI.Atlas.RenderPoint, pointToLayer: function (feature, latlng) { 
			//let icons = ['factory','warehouse','inventory','building','boat'];
			//let icon = icons[Math.floor(Math.random()*icons.length)];
			if (feature.properties.icon !== '') { feature.properties.style.img = { url: 'images/markers/'+feature.properties.icon+'.png' }; }
			//feature.properties.style.img = { url: 'images/markers/'+icon+'.png' };
			
			return L.circleMarker(latlng, MI.Atlas.styles.point); 
		} });	
		
		for (let j in MI.Atlas.map._layers) { 
			if (MI.Atlas.map._layers[j].feature && MI.Atlas.map._layers[j].feature.properties.clustered) {
				MI.Atlas.RenderPoint(MI.Atlas.map._layers[j].feature,MI.Atlas.map._layers[j]);
			}	 
		}
		
		pointLayer.on('mouseup', function(e){	});
		
		MI.Atlas.maplayer.push({id: d.details.id, points: pointLayer, lines: lineLayer, arrows: arrowLayer});
		
		d.details.layers.push(maplayergroup.addLayer(pointLayer));
		d.details.layers.push(MI.Atlas.map.addLayer(maplayergroup));
	
		MI.Interface.RefreshMeasureList();
		if (MI.options.storyMap) { MI.Interface.SetupStoryTrigger('#mlist-'+d.details.id+' li .mdetail_title'); }
		
		return d;
	}
		
	SetupStyle(d) {
		d.options = d.options ? d.options : {};
		
		MI.Atlas.styles.point.fontsize = d.options.fontsize ? d.options.fontsize : MI.Atlas.styles.point.fontsize;
		
		let colors =  d.options.color ? d.options.color : (d.properties.title === 'Manifest' ? ['#4d34db','#dfdbf9','#dfdbf9'] : MI.Atlas.SupplyColor());
		let styling = {color: colors, style: Object.assign({}, MI.Atlas.styles.point)};	
		let globes = ['americas','asia','europe','africa'];
			
		Object.assign(d.details, {style: Object.assign(styling.style, {fillColor: styling.color[0], color: styling.color[1], textColor: styling.color[2], darkerColor: tinycolor(styling.color[0]).darken(30).toString(), darkColor: tinycolor(styling.color[0]).darken(10).toString(), highlightColor: tinycolor(styling.color[0]).spin(30).saturate(100).toString(), lightColor: tinycolor(styling.color[0]).setAlpha(0.1).toString()}), colorchoice: styling.color, globe: globes[Math.floor(Math.random() * globes.length)]});
	}
	
	SetupPoint(ft, d, index) {
		let setup = { index: index, type: 'node', style: JSON.parse(JSON.stringify(d.details.style)), basestyle: JSON.parse(JSON.stringify(d.details.style)), latlng: new L.LatLng(ft.geometry.coordinates[1], ft.geometry.coordinates[0]), measures: this.SetupMeasures(ft, d.details)};
		
		// Individual point color
		if ( ft.properties.color ) { 
			let ftcolors = ft.properties.color.split(',');
			setup.style = {fillColor: ftcolors[0], color: ftcolors[1], textColor: ftcolors[2], darkerColor: tinycolor(ftcolors[0]).darken(30).toString(), darkColor: tinycolor(ftcolors[0]).darken(10).toString(), highlightColor: tinycolor(ftcolors[0]).spin(30).saturate(100).toString(), lightColor: tinycolor(ftcolors[0]).setAlpha(0.1).toString()};
		}
		Object.assign(ft.properties, setup);
		
		let li = 
		`<li id="local_${ft.properties.lid}" class="scref-${d.details.id}">
			<div class="dot" style="background: ${d.details.style.fillColor}; border-color: ${d.details.style.color};">${ft.properties.mindex}</div>
			<h5 class="mdetail_title">${ft.properties.title}</h5>
			<div class="pdetails">
				${ ft.properties.placename !== '' ? `<p class="placename" style="color: ${d.details.style.darkerColor};">${ft.properties.placename}</p>` : ''}
				${ ft.properties.categories.length !== 0 ? `<p class="category"> ${ft.properties.categories.map(cat => `<a class="cat-link" data-cat="cat-${d.details.id}-${cat}">${cat}</a>`).join(" ")}</p>` : ''}
				${ ft.properties.measures.length !== 0 ? `<p class="measures"> ${ft.properties.measures.filter(m => m && m.mvalue).map(m => (m.mtype === 'starttime' || m.mtype === 'endtime') ? new Date(Number(m.mvalue)*1000).toDateString() : `<span class="mtype">${m.mtype}</span>${m.mvalue}${m.munit}`).join(", ")}</p>` : ''}
			</div> 
				
			${ft.properties.images.length !== 0 ? `<div class="featuredimages ${ft.properties.images.length > 1 ? `multiple` : ''}" ${ft.properties.images.length > 1 ? `data-index="1"` : ''}>
				
				${ft.properties.images.map((img,i) => img.URL ? (img.URL.substring(0,24) === 'https://www.youtube.com/' ? 
				`<iframe class="ftimg" src="${img.URL}?modestbranding=1&enablejsapi=1&rel=0&fs=0&color=white&controls=0" width="560" height="315" ${i !== 0 || ft.properties.mindex !== 1 ? `loading="lazy"` : ''} frameborder="0"></iframe>` : 
				`<img class="ftimg" ${i !== 0 || ft.properties.mindex !== 1 ? `loading="lazy"` : ''} src="${img.URL}" title="${img.caption ? img.caption : ft.properties.title}" alt="${img.caption ? img.caption : ft.properties.title} ${img.caption ? '' : `image`}"/>` ) : '').join('')} 
				
				${ft.properties.images.length > 1 ? 
				`<div class="images-controls">
					<button id="imgbutton-left_${ft.properties.lid}" class="images-button images-display-left"><i class="fas fa-caret-left"></i></button>
					<div class="images-box">${(ft.properties.images.map((img,i) => { return `<div class="images-spot ${i === 0 ? `selected`: ''}" data-lid="${ft.properties.lid}" data-index="${Number(i+1)}"><i class="far fa-circle"></i></div>`; })).join('')}</div>
					<button id="imgbutton-right_${ft.properties.lid}" class="images-button images-display-right"><i class="fas fa-caret-right"></i></button>
				</div>` : ''} 
			</div>` : ''}
								  	
			<div class="description">${ft.properties.description !== '' ? ManifestUtilities.Linkify(ft.properties.description) : ''}</div>
			<details class="sources ${(ft.properties.sources.length === 1 && !(ft.properties.sources[0]) && !(ft.properties.notes)) ? "closed" : ""}" style="background: ${d.details.style.lightColor};">
				<summary>Notes</summary>
				<ol>
					${ft.properties.sources.map(src => src ? `<li>${ManifestUtilities.Linkify(src)}</li>` : '').join("")}
					${ManifestUtilities.Linkify(ft.properties.notes)}
				</ol>
			</details>
		</li>`;
		
		return {'li':li, 'ft':ft};
	}
	
	SetupLine(ft, d, index) {		
		let fromx = ft.geometry.coordinates[0][0]; let fromy = ft.geometry.coordinates[0][1];
		let tox = ft.geometry.coordinates[1][0]; let toy = ft.geometry.coordinates[1][1];		
		if (fromx === tox && fromy === toy) { return false; }
		
		ft.geometry.type = 'MultiLineString';
		ft.properties.type = 'line';
		ft.properties.clustered = null;
		

		let multipass = Grate.great_circle_route([fromx, fromy], [tox, toy], 60, MI.Atlas.map.getPixelBounds());  
		
		let sign = Number(Math.sign(multipass[0][0][0] - multipass[0][1][0])), breakstart = 0, breakend = multipass.length, checksign = 0;
        for (let i = 0; i < multipass[0].length-1; i++) {		
			checksign = Math.sign(multipass[0][i][0] - multipass[0][i+1][0]);	
			if (checksign !== sign && multipass[0][i][0] !== multipass[0][i+1][0]) {
				if (breakstart === 0) { breakstart = i;} breakend = i;
			}  
		}
		
		if ( breakstart !== 0 && !isNaN(sign)) { 
			if (sign === 1) {
				let part1 = multipass[0].slice(0, breakstart); part1.push([-180, part1[part1.length-1][1]]);
				let part2 = multipass[0].slice(breakend+1,multipass[0].length); part2.unshift([180, part1[part1.length-1][1]]);
				ft.geometry.coordinates = [part1, part2];
				
			} else if (sign === -1) {
				let part1 = multipass[0].slice(0, breakstart); part1.push([180, part1[part1.length-1][1]]); 
				let part2 = multipass[0].slice(breakend+1,multipass[0].length); part2.unshift([-180, part1[part1.length-1][1]]);
				ft.geometry.coordinates = [part1, part2];
			}
		} 
		else { ft.geometry.coordinates = multipass; }
		
		ft.geometry.raw = multipass;
		ft.properties.style = Object.assign(MI.Atlas.styles.line, {color: d.details.style.darkColor});
		ft.properties.basestyle = MI.Atlas.styles.line;
							
		return ft;
	}
	SetupSimpleLine(ft, d, index) {		
		let fromx = ft.geometry.coordinates[0][0]; let fromy = ft.geometry.coordinates[0][1];
		let tox = ft.geometry.coordinates[1][0]; let toy = ft.geometry.coordinates[1][1];		
		if (fromx === tox && fromy === toy) { return false; }
	
		ft.geometry.type = 'MultiLineString';
		ft.properties.type = 'line';
		ft.properties.clustered = null;

		if (fromx - tox >= 180) { let sign = Math.sign(tox); tox = -180 * sign; }
		else if (tox - fromx >= 180) { let sign = Math.sign(fromx); fromx = -180 * sign; }
		let multipass = Grate.great_circle_route([fromx, fromy], [tox, toy], 3); 
		ft.geometry.coordinates = multipass; 
	
		ft.geometry.raw = multipass;
		ft.properties.style = Object.assign(MI.Atlas.styles.line, {color: d.details.style.darkColor});
		ft.properties.basestyle = MI.Atlas.styles.line;
						
		return ft;
	}
	SetupArrow(ft, d, index) {	
		let midindex = Math.floor((ft.geometry.raw[0].length-1)*0.8);
		let middle = ft.geometry.raw[0][midindex];		
		let angle = Math.atan2(ft.geometry.raw[0][midindex+5][0] - ft.geometry.raw[0][midindex-5][0], ft.geometry.raw[0][midindex+5][1] - ft.geometry.raw[0][midindex-5][1]) * 180 / Math.PI;

		let arrow = {
			type: 'Feature',
			properties: ft.properties,
			geometry: { type: 'Point', coordinates:  ft.geometry.raw[0][midindex] }
		};
		Object.assign(arrow.properties, { type: 'arrow', angle: angle, 
			style: Object.assign(MI.Atlas.styles.arrow, {color: d.details.style.darkColor, fillColor: d.details.style.color}),
			basestyle: Object.assign(MI.Atlas.styles.arrow, {color: d.details.style.darkColor, fillColor: d.details.style.color}) });
		return arrow;
	}	
	SetupSimpleArrow(ft, d, index) {	
		let start = ft.geometry.coordinates[0][0], mid = ft.geometry.coordinates[0][1], end = ft.geometry.coordinates[0][2];
	
		let cy = 2*mid[1] - start[1]/2 - end[1]/2, cx = 2*mid[0] - start[0]/2 - end[0]/2;
	
		let t = 0.5; // given example value
		let ax = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * cx + t * t * end[0];
		let ay = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * cy + t * t * end[1];
	
		let angle = Math.atan2(end[0] - ax, end[1] - ay) * 180 / Math.PI;

		let arrow = {
			type: 'Feature',
			properties: ft.properties,
			geometry: { type: 'Point', coordinates:  [ax,ay] }		
		};
		Object.assign(arrow.properties, { type: 'arrow', angle: angle, 
			style: Object.assign(MI.Atlas.styles.arrow, {color: d.details.style.darkColor, fillColor: d.details.style.color}),
			basestyle: Object.assign(MI.Atlas.styles.arrow, {color: d.details.style.darkColor, fillColor: d.details.style.color}) });
		return arrow;
	}	
	SetupMeasures(ft, sc) {
		let measure = ft.properties.measures, measure_list = Object.assign([], this.measures), measurecheck = false, smapmeasures = [];
		for (let e in ft.properties.measures) {
			if (ft.properties.measures[e].mtype !== '') {
				let ftmeasure = ft.properties.measures[e], measurecheck = false;
			
				for (let l in measure_list) { if (l.measure === ftmeasure.mtype) { measurecheck = true; } }
				if (measurecheck === false) { measure_list.push({measure: ftmeasure.mtype, unit: ftmeasure.munit}); }
				if (ftmeasure.mtype === 'length') {ftmeasure.mtype = "Length"; }
				if (typeof sc.measures[ftmeasure.mtype] === 'undefined') { sc.measures[ftmeasure.mtype] = {max: 1, min: 0}; }
				let mmax = Number(sc.measures[ftmeasure.mtype].max) > Number(ftmeasure.mvalue) ? Number(sc.measures[ftmeasure.mtype].max) : Number(ftmeasure.mvalue);
				sc.measures[ftmeasure.mtype] = { max: mmax, min: 0 };
			} 
		}
	
		for (let l in measure_list) {		
			if (typeof ft.properties[measure_list[l].measure] !== 'undefined') { 
				if (typeof sc.measures[measure_list[l].measure] === 'undefined') { sc.measures[measure_list[l].measure] = {max: 1, min: 0}; }
				sc.measures[measure_list[l].measure] = { max: Number(sc.measures[measure_list[l].measure].max) + Number(ft.properties[measure_list[l].measure]), min: 0 };
	
				measure[measure_list[l].measure] = ft.properties[measure_list[l].measure]; 
				smapmeasures.push({mtype: measure_list[l].measure, munit: measure_list[l].unit, mvalue: ft.properties[measure_list[l].measure]});
			}
		}		
		return smapmeasures.length > 0 ? smapmeasures : (Object.entries(ft.properties.measures).length === 0 ? [] : ft.properties.measures);
	}
	
	/** Removes a supply chain from the interface (along with its data) **/
	Remove(id) {
		event.stopPropagation();

		let offset = document.getElementById('mheader-'+id).offsetHeight;
		let targetid = 0;
	
		if (MI.supplychains.length > 1) {
			let prev = document.getElementById('mheader-'+id).previousElementSibling;
			while (prev) { if (prev.classList.contains('mheader')) { offset += prev.offsetHeight; } prev = prev.previousElementSibling; }
		
			let next = document.getElementById('mheader-'+id).nextElementSibling;
			while (next) { if (next.classList.contains('mheader')) { break; } next = next.nextElementSibling; }
		
			if (!next) {
				offset = 0;		
				next = prev = document.getElementById('mheader-'+id).previousElementSibling; 
				while (prev) { if (prev.classList.contains('mheader')) { offset += prev.offsetHeight; } prev = prev.previousElementSibling; }

			 }
			targetid = next.id.split('-')[1];	
		}
		
		['mheader-'+id,'mdetails-'+id,'mlist-'+id,'supplycat-'+id,].map(document.getElementById, document).forEach(el => { el.remove(); }); 

		for (let s in MI.supplychains) {
			if (MI.supplychains[s].details.id === id) {
				for (let l of MI.supplychains[s].details.layers) { MI.Atlas.map.removeLayer(l); }
				delete MI.supplychains[s]; MI.supplychains.splice(s, 1);
			}
		}
		for (let s in MI.supplychains) { 
			for (let n in MI.supplychains[s].graph.nodes) { 
				if (MI.supplychains[s].graph.nodes[n].hasOwnProperty('ref')) { MI.supplychains[s].graph.nodes[n].ref.properties.index = s;   } 
			} 	// TODO can we just change the original and not the ref?
		}
		for (let l in MI.Atlas.maplayer) {
			if (MI.Atlas.maplayer[l].id === id) {
				delete MI.Atlas.maplayer[l]; MI.Atlas.maplayer.splice(l, 1);
			}
		}

		if (MI.supplychains.length !== 0) {
			MI.Interface.ShowHeader(targetid, true);
			if (document.getElementsByClassName('leaflet-popup').length > 0 && MI.Atlas.active_point) { MI.Atlas.MapPointClick(MI.Atlas.active_point, 'auto'); } 
		}
		else if (document.getElementById('minfodetail').classList.contains('closed')) { 
			MI.Interface.ShowLauncher(); 
			MI.Visualization.Set('map', MI.Interface.active_element);			
		}
	
		for (let i in MI.Atlas.map._layers) { 
			if (MI.Atlas.map._layers[i].feature && MI.Atlas.map._layers[i].feature.properties.clustered) {
				MI.Atlas.map._layers[i].feature.properties.clustered = [];	
				for (let j in MI.Atlas.map._layers) { 
					if (MI.Atlas.map._layers[j].feature && MI.Atlas.map._layers[j].feature.properties.clustered) {
						if (MI.Atlas.map._layers[i]._latlng.equals(MI.Atlas.map._layers[j]._latlng) && 
							MI.Atlas.map._layers[i]._leaflet_id !== MI.Atlas.map._layers[j]._leaflet_id) { 
							MI.Atlas.map._layers[i].feature.properties.clustered.push(MI.Atlas.map._layers[j].feature);
						}
					}
				}
				MI.Atlas.RenderPoint(MI.Atlas.map._layers[i].feature,MI.Atlas.map._layers[i]);
			
			}
		}
	
		MI.Atlas.Refresh(); MI.Atlas.map.fitBounds(MI.Atlas.map.getBounds());
	
		MI.Interface.RefreshMeasureList(); 
		if (document.getElementById('blob-'+id)) { document.getElementById('blob-'+id).remove(); }

		MI.Visualization.Set(MI.Visualization.type, MI.Interface.active_element);			
		MI.Interface.SetDocumentTitle();	
	}
	
	Hide(id, hide, type='chain') {
		if (event) { event.stopPropagation(); }
		let offset = document.getElementById('mheader-'+id).offsetHeight, targetid = 0;
		
		if (type === 'chain') {	
			if (MI.supplychains.length > 1) {
				let prev = document.getElementById('mheader-'+id).previousElementSibling;
				while (prev) { if (prev.classList.contains('mheader')) { offset += prev.offsetHeight; } prev = prev.previousElementSibling; }
		
				let next = document.getElementById('mheader-'+id).nextElementSibling;
				while (next) { if (next.classList.contains('mheader')) { break; } next = next.nextElementSibling; }
		
				if (!next) {
					offset = 0;	next = prev = document.getElementById('mheader-'+id).previousElementSibling; 
					while (prev) { if (prev.classList.contains('mheader')) { offset += prev.offsetHeight; } prev = prev.previousElementSibling; }
				}
				targetid = next.id.split('-')[1];	
			}
		}
		let mlayer; for (let l of MI.Atlas.maplayer) { if (Number(l.id) === Number(id)) { mlayer = l; } }
		if (hide) {
			if (type === 'chain') { 
				document.getElementById('manifestlist').querySelectorAll('#mheader-'+id+', #mdetails-'+id+', #mlist-'+id).forEach(el => { el.style.display = 'none'; }); 
				MI.Atlas.map.removeLayer(mlayer.lines); MI.Atlas.map.removeLayer(mlayer.arrows); MI.Atlas.map.removeLayer(mlayer.points); 
				document.getElementById('supplycat-'+id).querySelectorAll('input').forEach(el =>  { el.checked = false; });
				//if (document.getElementsByClassName('pop-intro').length > 0) { MI.Atlas.SetActivePoint(null, true);}
			
				if (document.getElementsByClassName('leaflet-popup').length > 0 && MI.Atlas.active_point) { 
					let moffset = 0; document.getElementById('manifestlist').querySelectorAll('.mheader').forEach(el => { if (el.style.display !== 'none') { 
						el.style.top = moffset+'px'; moffset += el.offsetHeight; }});		
					let roffset = 0; Array.from(document.getElementById('manifestlist').querySelectorAll('.mheader')).reverse().forEach(el => { if (el.style.display !== 'none') { 
						el.style.bottom = roffset+'px'; roffset += el.offsetHeight;}});
					MI.Atlas.MapPointClick(MI.Atlas.active_point, 'auto'); } 
				else { MI.Interface.ShowHeader(targetid); }
	
			}
			if (type === 'nodes') { MI.Atlas.map.removeLayer(mlayer.points); }
			if (type === 'lines') { MI.Atlas.map.removeLayer(mlayer.lines); MI.Atlas.map.removeLayer(mlayer.arrows); }
			
		} else { 
			if (type === 'chain') { 
				document.getElementById('manifestlist').querySelectorAll('#mheader-'+id+', #mdetails-'+id+', #mlist-'+id+', #mlist-'+id+' li').forEach(el => { el.style.display = 'block'; }); 
				MI.Atlas.map.addLayer(mlayer.lines); MI.Atlas.map.addLayer(mlayer.arrows); MI.Atlas.map.addLayer(mlayer.points); 
				document.getElementById('supplycat-'+id).querySelectorAll('input').forEach(el =>  { el.checked = true; });
							
				if (!MI.options.storyMap) { 
					if (document.getElementsByClassName('leaflet-popup').length > 0 && MI.Atlas.active_point) { 
						let moffset = 0; document.getElementById('manifestlist').querySelectorAll('.mheader').forEach(el => { if (el.style.display !== 'none') { 
							el.style.top = moffset+'px'; moffset += el.offsetHeight; }});		
						let roffset = 0; Array.from(document.getElementById('manifestlist').querySelectorAll('.mheader')).reverse().forEach(el => { if (el.style.display !== 'none') { 
							el.style.bottom = roffset+'px'; roffset += el.offsetHeight;}});
						MI.Atlas.MapPointClick(MI.Atlas.active_point, 'auto'); 
					} 
					else { MI.Interface.ShowHeader(id); }
				}
			}
			if (type === 'nodes') { MI.Atlas.map.addLayer(mlayer.points); }
			if (type === 'lines') { 
				MI.Atlas.map.addLayer(mlayer.lines); MI.Atlas.map.addLayer(mlayer.arrows); 
				document.getElementById('nodeheader-'+id).querySelectorAll('input').forEach(el => { if (el.checked) { 
					MI.Atlas.map.removeLayer(mlayer.points); MI.Atlas.map.addLayer(mlayer.points);} }); 	
			}
		}
	
		if (!MI.options.storyMap) { MI.Visualization.Set(MI.Visualization.type, MI.Interface.active_element); }			
		MI.Atlas.Refresh();
	}
}
