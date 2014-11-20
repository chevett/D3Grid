/*jshint undef:true, es5:true, camelcase:true, forin:true, curly:true, eqeqeq:true */

var $ = require('jquery'),
	_ = require('lodash'),
	moment = require('moment'),
	d3 = require('d3');

function createHeader(opt) {
	if (opt.tableTitle) {
		d3.select(opt.containerSelector)
			.insert('div', opt.tableSelector)
			.classed('d3g-header', true)
			.append('span')
			.attr('id', opt.tableSelector.replace(/#/gi, '') + 'Header')
			.html(opt.tableTitle);
	}
}

function getTableStyling(opt) {
	var data = opt.tableStyling || {};
	var stylingClasses = 'table d3g-table';

	var bordered = typeof data.bordered !== 'undefined' ? data.bordered : true;
	var condensed = typeof data.bordered !== 'undefined' ? data.condensed : false;
	var striped = typeof data.striped !== 'undefined' ? data.striped : true;
	var hovered = typeof data.hovered !== 'undefined' ? data.hovered : true;

	stylingClasses += (bordered) ? ' table-bordered' : '';
	stylingClasses += (condensed) ? ' table-condensed' : '';
	stylingClasses += (striped) ? ' table-striped' : '';
	stylingClasses += (hovered) ? ' table-hovered' : '';

	return stylingClasses;
}

function getData(data, columnName){
	if (!data || !columnName)
		return data;

	var parts = columnName.split('.').filter(Boolean);
	var prop = _.first(columnName.split('.'));
	parts = _.rest(parts);

	return getData(data[prop], parts.join('.'));
}

function _create(opt) {
	createHeader(opt);
	$(opt.tableSelector).wrap('<div class="d3g-table-wrapper" />');

	var sortChangedCallbacks = $.Callbacks(),
		sortColumnName = opt.defaultSortColumn || '',
		sortAscending = (opt.defaultSortDirection && opt.defaultSortDirection === 'Descending') ? false : true,
		formatters = {
			plainText: function (txt) { return txt; },
			number: function (txt) { return txt; },
			date: function(d){ return moment(d).format('MMMM D YYYY, hh:mma'); },
			currency: function (txt) { return txt; },
			html: function (txt) { return $('<div />').html(txt).text(); },
			handlebars: (function () {
				var templates = {};

				return function (str, obj) {
					var f = templates[str] || (templates[str] = handlebars.compile($('<div />').html(str).text()));
					return f(obj);
				};
			})()
		};

	formatters = $.extend(opt.formatters || {}, formatters);

	$(opt.tableSelector).on('click', 'th.d3g-sortable', function () {
		var $selectedColumn = $(this),
			selectedColumnName = $selectedColumn.data('sort-column'),
			isActiveSort = $selectedColumn.hasClass('d3g-sort-active');

		// handle tracking sort column and direction here.
		sortColumnName = selectedColumnName;
		sortAscending = isActiveSort ? !sortAscending : true;

		sortChangedCallbacks.fire();
	});

	if (opt.onCellClick) {
		$(opt.tableSelector).on('click', 'tbody tr td', function () {
			var cell = this;
			opt.onCellClick(cell);
		});
	}

	return {
		render: function (data) {

			var visibleColumns = data.columns.filter(function (column) { 
				return column.includeType === undefined || column.includeType === 'Column';
			});
			var $table = $(opt.tableSelector);
			$table.empty();
			var tableStyling = getTableStyling(opt);

			var table = d3.select(opt.tableSelector)
				.classed(tableStyling, true);

			var tableHeader = table
					.append('thead')
					.classed('d3g-table-header', true)
					.append('tr')
					.selectAll('th')
					.data(visibleColumns)
					.enter()
					.append('th')
					.attr('class', function (d) {

						var classValues = 'd3g-header-' + d.index;

						if (d.isSortable === true) {
							classValues = classValues + ' d3g-sortable';
						}

						if (d.sortColumnName === sortColumnName) {
							classValues = classValues + ' d3g-sort-active';

							if (sortAscending) {
								classValues = classValues + ' d3g-sort-asc';
							} else {
								classValues = classValues + ' d3g-sort-desc';
							}
						}

						return classValues;
					})
					.attr('data-sort-column', function (d) {
						if (d.isSortable === true) {
							return d.sortColumnName;
						}
					})
					.html(function (d) {
						var content = d.label || d.name;
						// add sort icon
						if (d.isSortable === true) {
							content += '<span class="text-icon d3g-sort-icon"></span>';
						}
						return content;

					});

			var tableBody = table.append('tbody');

			var rows = tableBody.selectAll('tr')
					.data(data.rows)
					.enter()
					.append('tr');

			var cells = rows.selectAll('td')
					.data(visibleColumns)
					.enter()
					.append('td')
					.attr('class', function (d) { return 'd3g-content-' + d.index; })
					.html(function (d, columnIndex, rowIndex) {

						var columnName = d.name,
							rowData = data.rows[rowIndex],
							datum = getData(rowData, columnName),
							customFormatter;

						// check for a custom formatter from the create options
						if (formatters.custom) {
							customFormatter = formatters.custom[columnName];

							if (typeof customFormatter === 'function') {
								return customFormatter(datum, rowData);
							}
						}

						// check for a custom formatter on the column object.
						customFormatter = d.formatter;
						if (typeof customFormatter === 'function') {
							return customFormatter(datum, rowData);
						}

						return formatters[d.format || 'plainText'](datum, rowData);
					});
		},

		sortColumnChanged: {
			addHandler: function (cb) { sortChangedCallbacks.add(cb); },
			removeHandler: function (cb) { sortChangedCallbacks.remove(cb); }
		},
		getSortParameters: function () {
			return {
				SortColumnName: sortColumnName,
				SortOrder: sortAscending ? 'Ascending' : 'Descending'
			};
		}
	};
}

module.exports = _create;

