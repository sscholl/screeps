#define PHASE_SEARCH    'search'
#define PHASE_TASK      'task'
#define PHASE_HARVEST    'harvest'
#define PHASE_DELIVER    'deliver'
#define PHASE_UPGRADE    'upgrade'

#define BODY_DEFAULT     'default'
#define BODY_HARVESTER    'worker'
#define BODY_UPGRADER    'upgrader'
#define BODY_HEALER        'healer'
#define BODY_RANGER        'ranger'


#define TASK_HARVEST 'TASK_HARVEST' // source: harvest energy from a source
#define TASK_COLLECT 'TASK_COLLECT' // source: collect dropped energy or from a creep
#define TASK_DELIVER 'TASK_DELIVER' // sink: deliver energy to a energy sink
#define TASK_UPGRADE 'TASK_UPGRADE' // sink: upgrade controller
#define TASK_BUILD   'TASK_BUILD'   // sink: build a construction site
#define TASK_REPAIR  'TASK_REPAIR'  // sink: repair a structure