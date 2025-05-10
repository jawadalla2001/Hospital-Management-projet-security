/**
 * Hospital Management System
 * Dashboard JavaScript - Handles all dynamic functionality for the hospital dashboard
 */

$(document).ready(function() {
    // Initialize date range picker for dashboard filtering
    initializeDateRangePicker();
    
    // Initialize all dashboard charts
    initializeCharts();
    
    // Set up auto-refresh for real-time metrics
    setupAutoRefresh();
    
    // Initialize quick actions
    setupQuickActions();
    
    // Add event handlers for dashboard interactions
    addEventHandlers();
});

/**
 * Initialize date range picker
 */
function initializeDateRangePicker() {
    if ($.fn.daterangepicker) {
        $('#dashboard-date-range').daterangepicker({
            ranges: {
                'Today': [moment(), moment()],
                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                'This Month': [moment().startOf('month'), moment().endOf('month')],
                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
            },
            startDate: moment().subtract(29, 'days'),
            endDate: moment()
        }, function(start, end) {
            $('#dashboard-date-range span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
            updateDashboardData(start, end);
        });
        
        $('#dashboard-date-range span').html(moment().subtract(29, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));
    }
}

/**
 * Initialize all dashboard charts
 */
function initializeCharts() {
    initializePatientChart();
    initializeDepartmentChart();
    initializeAppointmentStatusChart();
    initializeBedOccupancyChart();
    initializeRevenueChart();
}

/**
 * Initialize patient statistics chart
 */
function initializePatientChart() {
    if (Chart) {
        // Patient statistics line chart
        var ctx = document.getElementById('patient-statistics-chart').getContext('2d');
        var gradient = ctx.createLinearGradient(0, 0, 0, 240);
        gradient.addColorStop(0, 'rgba(41, 128, 185, 0.4)');
        gradient.addColorStop(1, 'rgba(41, 128, 185, 0.0)');
        
        var patientChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'New Patients',
                    data: [65, 59, 80, 81, 56, 55, 40, 38, 45, 60, 70, 75],
                    backgroundColor: gradient,
                    borderColor: '#2980b9',
                    borderWidth: 2,
                    pointBackgroundColor: '#2980b9',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#2980b9',
                    pointHoverBorderWidth: 2,
                    pointHoverRadius: 6,
                    fill: 'start'
                }, {
                    label: 'Returning Patients',
                    data: [28, 48, 40, 19, 86, 27, 90, 85, 90, 110, 120, 130],
                    backgroundColor: 'transparent',
                    borderColor: '#27ae60',
                    borderWidth: 2,
                    pointBackgroundColor: '#27ae60',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#27ae60',
                    pointHoverBorderWidth: 2,
                    pointHoverRadius: 6,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    titleFontSize: 14,
                    titleFontStyle: 'bold',
                    bodyFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    bodyFontSize: 12,
                    bodySpacing: 4,
                    xPadding: 12,
                    yPadding: 12,
                    caretSize: 6,
                    caretPadding: 8,
                    callbacks: {
                        title: function(tooltipItem, data) {
                            return data.labels[tooltipItem[0].index];
                        },
                        label: function(tooltipItem, data) {
                            return data.datasets[tooltipItem.datasetIndex].label + ': ' + tooltipItem.yLabel;
                        }
                    }
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                },
                scales: {
                    xAxes: [{
                        display: true,
                        gridLines: {
                            display: false,
                            drawBorder: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Month'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        gridLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Patients'
                        },
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                }
            }
        });
    }
}

/**
 * Initialize department performance chart
 */
function initializeDepartmentChart() {
    if (Chart) {
        // Department performance chart
        var ctx = document.getElementById('department-performance-chart').getContext('2d');
        
        var departmentChart = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: ['Cardiology', 'Neurology', 'Orthopedics', 'Oncology', 'Pediatrics', 'Gynecology'],
                datasets: [{
                    label: 'Patients Treated',
                    data: [65, 59, 80, 81, 56, 55],
                    backgroundColor: [
                        'rgba(41, 128, 185, 0.7)',
                        'rgba(39, 174, 96, 0.7)',
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(241, 196, 15, 0.7)',
                        'rgba(142, 68, 173, 0.7)',
                        'rgba(230, 126, 34, 0.7)'
                    ],
                    borderColor: [
                        'rgba(41, 128, 185, 1)',
                        'rgba(39, 174, 96, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(241, 196, 15, 1)',
                        'rgba(142, 68, 173, 1)',
                        'rgba(230, 126, 34, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true
                        },
                        gridLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    }],
                    yAxes: [{
                        gridLines: {
                            display: false,
                            drawBorder: false
                        }
                    }]
                },
                tooltips: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    titleFontSize: 14,
                    titleFontStyle: 'bold',
                    bodyFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    bodyFontSize: 12,
                    callbacks: {
                        label: function(tooltipItem, data) {
                            return 'Patients: ' + tooltipItem.xLabel;
                        }
                    }
                }
            }
        });
    }
}

/**
 * Initialize appointment status chart
 */
function initializeAppointmentStatusChart() {
    if (Chart) {
        // Appointment status doughnut chart
        var ctx = document.getElementById('appointment-status-chart').getContext('2d');
        
        var appointmentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Scheduled', 'Cancelled', 'No-show'],
                datasets: [{
                    data: [65, 20, 10, 5],
                    backgroundColor: [
                        'rgba(39, 174, 96, 0.7)',
                        'rgba(41, 128, 185, 0.7)',
                        'rgba(231, 76, 60, 0.7)',
                        'rgba(142, 68, 173, 0.7)'
                    ],
                    borderColor: [
                        'rgba(39, 174, 96, 1)',
                        'rgba(41, 128, 185, 1)',
                        'rgba(231, 76, 60, 1)',
                        'rgba(142, 68, 173, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 12,
                        padding: 20
                    }
                },
                cutoutPercentage: 70,
                tooltips: {
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    titleFontSize: 14,
                    titleFontStyle: 'bold',
                    bodyFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    bodyFontSize: 12,
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var dataset = data.datasets[tooltipItem.datasetIndex];
                            var total = dataset.data.reduce(function(previousValue, currentValue) {
                                return previousValue + currentValue;
                            });
                            var currentValue = dataset.data[tooltipItem.index];
                            var percentage = Math.floor(((currentValue/total) * 100) + 0.5);
                            
                            return data.labels[tooltipItem.index] + ': ' + currentValue + ' (' + percentage + '%)';
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true
                }
            }
        });
    }
}

/**
 * Initialize bed occupancy chart
 */
function initializeBedOccupancyChart() {
    if (Chart) {
        // Bed occupancy chart
        var ctx = document.getElementById('bed-occupancy-chart').getContext('2d');
        
        var bedOccupancyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['ICU', 'General Ward', 'Private Rooms', 'Emergency', 'Maternity', 'Pediatric'],
                datasets: [{
                    label: 'Occupied',
                    data: [12, 45, 18, 8, 15, 10],
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
                }, {
                    label: 'Available',
                    data: [3, 15, 12, 7, 5, 10],
                    backgroundColor: 'rgba(39, 174, 96, 0.7)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    xAxes: [{
                        stacked: true,
                        gridLines: {
                            display: false,
                            drawBorder: false
                        }
                    }],
                    yAxes: [{
                        stacked: true,
                        ticks: {
                            beginAtZero: true
                        },
                        gridLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        }
                    }]
                },
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    titleFontSize: 14,
                    titleFontStyle: 'bold',
                    bodyFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    bodyFontSize: 12
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                }
            }
        });
    }
}

/**
 * Initialize revenue chart
 */
function initializeRevenueChart() {
    if (Chart) {
        // Revenue chart
        var ctx = document.getElementById('revenue-chart').getContext('2d');
        
        var revenueChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Revenue',
                    data: [12000, 19000, 15000, 17000, 22000, 18000, 20000, 25000, 23000, 25000, 27000, 30000],
                    backgroundColor: 'rgba(241, 196, 15, 0.1)',
                    borderColor: 'rgba(241, 196, 15, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(241, 196, 15, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(241, 196, 15, 1)',
                    pointHoverBorderWidth: 2,
                    pointHoverRadius: 6,
                    fill: true
                }, {
                    label: 'Expenses',
                    data: [8000, 9000, 11000, 10000, 12000, 13000, 10000, 14000, 15000, 13000, 15000, 16000],
                    backgroundColor: 'transparent',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(231, 76, 60, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(231, 76, 60, 1)',
                    pointHoverBorderWidth: 2,
                    pointHoverRadius: 6,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: true,
                    position: 'top'
                },
                scales: {
                    xAxes: [{
                        display: true,
                        gridLines: {
                            display: false,
                            drawBorder: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Month'
                        }
                    }],
                    yAxes: [{
                        display: true,
                        gridLines: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Amount ($)'
                        },
                        ticks: {
                            beginAtZero: true,
                            callback: function(value, index, values) {
                                return '$' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            }
                        }
                    }]
                },
                tooltips: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    titleFontSize: 14,
                    titleFontStyle: 'bold',
                    bodyFontFamily: "'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
                    bodyFontSize: 12,
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var label = data.datasets[tooltipItem.datasetIndex].label || '';
                            
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + tooltipItem.yLabel.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                            return label;
                        }
                    }
                },
                hover: {
                    mode: 'nearest',
                    intersect: true
                }
            }
        });
    }
}

/**
 * Set up auto-refresh for real-time metrics
 */
function setupAutoRefresh() {
    // Auto-refresh KPI cards every 5 minutes
    setInterval(function() {
        refreshKPICards();
    }, 300000); // 5 minutes
    
    // Add refresh button functionality
    $('#refresh-dashboard').on('click', function() {
        refreshDashboard();
    });
}

/**
 * Refresh KPI cards with the latest data
 */
function refreshKPICards() {
    // In a real application, this would fetch data from the server
    // This is a simulation that updates the numbers with random changes
    
    // Update doctors count
    var doctorsCount = parseInt($('#doctors-count').text().trim());
    var doctorsChange = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
    $('#doctors-count').text(doctorsCount + doctorsChange);
    updateTrend('#doctors-trend', doctorsChange);
    
    // Update appointments count
    var appointmentsCount = parseInt($('#appointments-count').text().trim());
    var appointmentsChange = Math.floor(Math.random() * 5) - 2; // -2 to 2
    $('#appointments-count').text(appointmentsCount + appointmentsChange);
    updateTrend('#appointments-trend', appointmentsChange);
    
    // Update patients count
    var patientsCount = parseInt($('#patients-count').text().trim());
    var patientsChange = Math.floor(Math.random() * 7) - 3; // -3 to 3
    $('#patients-count').text(patientsCount + patientsChange);
    updateTrend('#patients-trend', patientsChange);
    
    // Update revenue
    var revenue = parseFloat($('#revenue-count').text().replace('$', '').replace(',', ''));
    var revenueChange = Math.floor(Math.random() * 1000) - 400; // -400 to 599
    var newRevenue = revenue + revenueChange;
    $('#revenue-count').text('$' + newRevenue.toLocaleString());
    updateTrend('#revenue-trend', revenueChange);
    
    // Show refresh animation
    $('.dash-card').addClass('refreshed');
    setTimeout(function() {
        $('.dash-card').removeClass('refreshed');
    }, 1000);
}

/**
 * Update trend indicator
 */
function updateTrend(selector, change) {
    var trend = $(selector);
    
    if (change > 0) {
        trend.html('<i class="fa fa-arrow-up text-success"></i> ' + Math.abs(change));
        trend.removeClass('text-danger').addClass('text-success');
    } else if (change < 0) {
        trend.html('<i class="fa fa-arrow-down text-danger"></i> ' + Math.abs(change));
        trend.removeClass('text-success').addClass('text-danger');
    } else {
        trend.html('<i class="fa fa-minus text-muted"></i> 0');
        trend.removeClass('text-success text-danger').addClass('text-muted');
    }
}

/**
 * Refresh entire dashboard
 */
function refreshDashboard() {
    $('#dashboard-loading').fadeIn();
    
    // Simulate loading delay
    setTimeout(function() {
        refreshKPICards();
        // Re-initialize charts with new data (in a real app, this would fetch fresh data)
        initializeCharts();
        
        $('#dashboard-loading').fadeOut();
        
        // Show success message
        $('#refresh-success').fadeIn().delay(3000).fadeOut();
    }, 1500);
}

/**
 * Update dashboard data based on date range
 */
function updateDashboardData(start, end) {
    $('#dashboard-loading').fadeIn();
    
    // In a real application, this would fetch data for the selected date range
    // This is a simulation that updates the UI after a delay
    setTimeout(function() {
        // Update KPI cards with "new" data
        $('#doctors-count').text(Math.floor(Math.random() * 10) + 15);
        $('#appointments-count').text(Math.floor(Math.random() * 50) + 100);
        $('#patients-count').text(Math.floor(Math.random() * 30) + 70);
        $('#revenue-count').text('$' + (Math.floor(Math.random() * 10000) + 20000).toLocaleString());
        
        // Re-initialize charts with "new" data
        initializeCharts();
        
        $('#dashboard-loading').fadeOut();
    }, 1500);
}

/**
 * Set up quick actions
 */
function setupQuickActions() {
    $('.quick-action').on('click', function(e) {
        e.preventDefault();
        
        var action = $(this).data('action');
        
        switch(action) {
            case 'new-appointment':
                window.location.href = '/appointment/add_appointment';
                break;
            case 'new-patient':
                window.location.href = '/patients/add';
                break;
            case 'send-message':
                window.location.href = '/compose';
                break;
            case 'generate-report':
                showReportModal();
                break;
            default:
                // Do nothing
        }
    });
}

/**
 * Show report generation modal
 */
function showReportModal() {
    $('#report-modal').modal('show');
}

/**
 * Add event handlers for dashboard interactions
 */
function addEventHandlers() {
    // Toggle detailed statistics sections
    $('.toggle-stats').on('click', function() {
        var target = $(this).data('target');
        $(target).slideToggle();
        $(this).find('i').toggleClass('fa-chevron-down fa-chevron-up');
    });
    
    // Handle dashboard card expand/collapse
    $('.dash-card-header .expand-card').on('click', function() {
        var card = $(this).closest('.dash-card');
        
        if (card.hasClass('expanded')) {
            card.removeClass('expanded');
            $(this).html('<i class="fa fa-expand"></i>');
        } else {
            card.addClass('expanded');
            $(this).html('<i class="fa fa-compress"></i>');
        }
    });
    
    // Initialize tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Handle notification marking as read
    $('.notification-item .mark-as-read').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        $(this).closest('.notification-item').fadeOut(function() {
            $(this).remove();
            
            // Update notifications count
            var count = parseInt($('.notifications-count').text());
            $('.notifications-count').text(count - 1);
            
            if (count - 1 <= 0) {
                $('.notifications-count').hide();
                $('#no-notifications').show();
            }
        });
    });
}