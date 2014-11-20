/*jshint undef:true, es5:true, camelcase:true, forin:true, curly:true, eqeqeq:true */

/// <reference path="Scripts/jquery-1.9.1.intellisense.js" />
/// <reference path="Scripts/d3.v3.js" />


var $ = require('jquery'),
	d3 = require('d3'),
	_ = require('lodash'),
	createTable = require('./table'),
	createPager = require('./pager');

var DEFAULTS = {
	tableSelector: '.lgtm-table',
	pagerSelector: '.lgtm-pager',
	fetchRows: function(){console.dir('implement grid.fetchRows');},
};

function _create(opt) {

	opt = _.extend({},  DEFAULTS, opt);

	d3.select(opt.containerSelector).classed("d3g-container loading-content-container", true);

	var table = createTable(opt),
		pager = createPager(opt),
		pageCache;

	function _getPageAndSortParameters() {
		var pageAndSortParams = $.extend({}, table.getSortParameters(), pager.getPageParameters());

		if (typeof opt.customParams === 'function') {
			pageAndSortParams = opt.customParams(pageAndSortParams);
		}

		return pageAndSortParams;
	}

	function _startDataLoad(pageAndSortParameters) {
		//d3G.Modals.Loading.show({ showCurtain: false, selector: opt.containerSelector });

		pageAndSortParameters = pageAndSortParameters || _getPageAndSortParameters();

		var pageIndex = pageAndSortParameters.PageIndex,
			pageSize = pageAndSortParameters.PageSize;

		opt.fetchRows(pageIndex, pageSize, function(err, data, totalRows){
			if (err){
				console.error(err);
				return window.alert('grid error');
			}

			opt.rows = data;
			opt.totalRowCount = totalRows;
			pageCache[pageAndSortParameters.PageIndex] = opt; // um this is not ideal

			table.render(opt);
			pager.render(opt);
		});
	}

	table.sortColumnChanged.addHandler(function () {
		pageCache = {};
		pager.reset();
		_startDataLoad();
	});

	function changePage() {
		var pageAndSortParameters = _getPageAndSortParameters();

		if (pageCache[pageAndSortParameters.PageIndex]) {
			var gridData = pageCache[pageAndSortParameters.PageIndex];
			
			//d3G.Modals.Loading.hide({ showCurtain: false, selector: opt.containerSelector });
			table.render(gridData);
			pager.render(gridData);
		} else {
			_startDataLoad(pageAndSortParameters);
		}
	}

	pager.pageChanged.addHandler(function () {
		changePage();
	});

	pager.pageSizeChanged.addHandler(function () {
		pageCache = {};
		pager.reset();
		_startDataLoad();
	});

	return {
		table: table,
		pager: pager,
		render: function () {
			pageCache = {};
			pager.reset();
			_startDataLoad();
		}
	};
}

module.exports = _create;

