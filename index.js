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

	var $el = $('<div><table class="lgtm-table"></table><div class="lgtm-pager"></div></div>');
	

	d3.select($el[0]).classed("d3g-container loading-content-container", true);

	var table = createTable(opt, $el),
		pager = createPager(opt, $el),
		pageCache;

	function _getPageAndSortParameters() {
		var pageAndSortParams = $.extend({}, table.getSortParameters(), pager.getPageParameters());

		if (typeof opt.customParams === 'function') {
			pageAndSortParams = opt.customParams(pageAndSortParams);
		}

		return pageAndSortParams;
	}

	var _criteria = Object.create(null);
	function _setCriteria(name, value){
		if (_.isObject(name)){
			_criteria = name;
			return;
		} else {
			_criteria[name] = value;
		}
	}

	function _startDataLoad(pageAndSortParameters) {
		//d3G.Modals.Loading.show({ showCurtain: false, selector: opt.containerSelector });

		pageAndSortParameters = pageAndSortParameters || _getPageAndSortParameters();

		var pageIndex = pageAndSortParameters.PageIndex,
			pageSize = pageAndSortParameters.PageSize;

		var criteria = _.extend({}, _criteria);
		criteria.pageIndex = pageIndex;
		criteria.pageSize = pageSize;

		opt.fetchRows(criteria, function(err, data, totalRows){
			if (err){
				console.error(err);
				return window.alert('grid error');
			}

			opt.rows = data;
			opt.totalRowCount = totalRows;
			pageCache[pageIndex] = _.cloneDeep(opt); // um this is not ideal, deal with it

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
		element: $el[0],
		table: table,
		pager: pager,
		render: function () {
			pageCache = {};
			pager.reset();
			_startDataLoad();
		},
		setCriteria: _setCriteria,
	};
}

module.exports = _create;

