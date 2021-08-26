<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import { getSheet, editSheet } from '../plugin/google-sheet.js'
import { setCookie, getCookie } from '../utils/cookie.js'
import formatDate from "../utils/format-date";
import _findIndex from 'lodash/findIndex'
import _orderBy from 'lodash/orderBy'
import _groupBy from 'lodash/groupBy'

export default {
  name: 'Home',
  components: {
    HelloWorld
  },
  data() {
    return {
      loadingNewUser: false,
      loadingGetData: false,
      loadingEditData: false,
      loadingInit: false,
      loadingCheckDate: false,
      loadingSetNewNumber: false,
      userName: '',
      newUserName: '',
      newNumber: '',
      dayDiffRankMap: {},
      sheet: [],
      today: formatDate(new Date()),
    }
  },
  computed: {
    userData() {
      const sheetItem = this.sheet.filter(item => {
        return item['名字'] === this.userName;
      });

      return sheetItem.length > 0
        ? sheetItem[0]
        : false
    },
    unUse() {
      const today = formatDate(new Date());

      const sheetItem = this.sheet.filter(item => {
        return !item[today];
      });

      return sheetItem;
    },
  },
  mounted() {
    this.userName = getCookie('userName');
    if(this.userName) {
      setCookie('userName', this.userName)
    }

    this.loadingInit = true;
    this.getData()
      .then(() => {
        this.loadingInit = false;
        this.checkDate();
      })

    // setCookie('userName', '')

  },
  methods: {
    ...formatDate,
    async checkDate() {
      this.loadingCheckDate = true;
      const today = formatDate(new Date());

      if(this.sheet[0][today] === undefined) {
        editSheet({
          value: today,
          cellIndex: [0, Object.keys(this.sheet[0]).length - 5 ]
        })
          .then(() => {
            editSheet({
              value: 0,
              cellIndex: [1, Object.keys(this.sheet[0]).length - 5 ]
            })
              .then(() => {
                this.getData();
              })
              .finally(() => {
                this.loadingCheckDate = false
              })
          })
      }else {
        this.loadingCheckDate = false
      }
    },
    async getData() {
      this.loadingGetData = true;

      const sheet = await getSheet().finally(()=>{ this.loadingGetData = false });

      const diffMap = () => {
        const diffMap = [];

        sheet.forEach((item, index) => {

          const map = () => {
            const map = {};

            Object.keys(item).forEach(key => {
              const isDay = key !== '名字' && key !== '頭像' && key.indexOf('_') === -1;
              const isNumber = Number(item[key]);

              if(isDay && isNumber) {
                map[key] = Math.abs(item[key] - sheet[0][key]) || 0
              }
            });

            return map;
          };

          diffMap.push({
            '名字': item['名字'],
            ...map()
          })
        });

        return diffMap
      };

      const dayDiffRankMap = () => {
        const dayDiffRankMap = {};

        Object.keys(sheet[0]).forEach(key => {
          const isDay = key !== '名字' && key !== '頭像' && key.indexOf('_') === -1;

          if(isDay) {
            dayDiffRankMap[key] = _orderBy(diffMap(), [key], ['desc']);
          }
        })

        return dayDiffRankMap
      };

      this.dayDiffRankMap = dayDiffRankMap();

      sheet.forEach((item, index) => {
        const keys = Object.keys(item);
        let tempItem = {};

        keys.forEach(key => {
          this.$set(this.sheet, index, {});

          if(key.indexOf('_') === -1) {
            tempItem[key] = item[key] || '';
          }
        });

        const dataCount = () => {
          let medals = 0;
          let dead = 0;
          let medalsStatus = '';
          let deadStatus = '';
          // let isFine = false;
          // let isWin = false;
          // let isLose = false;

          Object.keys(item).forEach(key => {
            const isDay = key !== '名字' && key !== '頭像' && key.indexOf('_') === -1;
            const isNumber = Number(item[key]);

            if(isDay && isNumber) {
              const isRange = Number(item[key]) >= Number(sheet[0][key]) - 5 && Number(item[key]) <= Number(sheet[0][key]) + 5;
              const isLose = dayDiffRankMap()[key][0]['名字'] === item['名字'] || dayDiffRankMap()[key][1]['名字'] === item['名字'];

              const isTodayNotZero = Number(sheet[0][this.today]) !== 0 || key !== this.today;
              const isToday = key === this.today;

              if(isRange) {
                medals += 1;
                if(isToday) {
                  medalsStatus = 'get'
                }
              }

              if(isLose && !isRange) {
                if(medals === 0) {
                  dead += 1;
                  if(isToday) {
                    deadStatus = 'get'
                  }
                }

                if(isTodayNotZero && medals > 0) {
                  medals -= 1;
                  if(isToday) {
                    medalsStatus = 'lose'
                  }
                }
              }
            };
          });

          return {
            medals, dead, medalsStatus, deadStatus
            // isFine, isWin, isLose
          }
        };

        tempItem['diff'] = Math.abs(item[this.today] - this.sheet[0][this.today]) || 0;
        tempItem['medals'] = dataCount().medals;
        tempItem['dead'] = dataCount().dead;
        tempItem['medalsStatus'] = dataCount().medalsStatus;
        tempItem['deadStatus'] = dataCount().deadStatus;

        this.$set(this.sheet, index, tempItem);
      });

      return true;
    },
    async newUser() {
      this.loadingNewUser = true;

      const sheet = await getSheet();
      const isOldUser = this.sheet.map(item => {
        return item['名字']
      }).includes(this.newUserName);

      if(isOldUser) {
        setCookie('userName', this.newUserName);
        this.userName = this.newUserName;
      }else {
        editSheet({
          value: this.newUserName,
          cellName: `A${sheet.length + 2}`
        })
          .then(async ()=> {
            await this.getData()
              .then(() => {
                setCookie('userName', this.newUserName);
                this.userName = this.newUserName;
              })
          })
          .finally(() => {
            this.loadingNewUser = false;
          })
      }
    },
    async editData(value, index) {
      if(value && Number(value)) {
        this.loadingEditData = true;

        editSheet({
          value,
          cellName: `B${index + 2}`
        })
          .finally(() => {
            this.loadingEditData = false;
          })
      }else {

      }
    },
    async setNewNumber() {
      if(this.newNumber && Number(this.newNumber)) {
        this.loadingSetNewNumber = true;
        const today = formatDate(new Date());

        const nameIndex = _findIndex(this.sheet, (item) => {
          return item['名字'] === this.userName;
        });

        const dateIndex = _findIndex(Object.keys(this.sheet[0]), (key) => {
          return key === today;
        });

        editSheet({
          value: this.newNumber,
          cellIndex: [nameIndex + 1,  dateIndex + 2]
        })
          .then(() => {
            this.getData();

            this.$message({
              message: '輸入成功',
              type: 'success'
            });
          })
          .finally(() => {
            this.loadingSetNewNumber = false;
          })
      }

    }
  }
}
</script>
<template>
  <div :class="$style.home" class="home py-5">
    <div class="container text-left">

      <transition-group name="el-fade-in-linear" mode="in-out">
        <div key="loading" class="box" v-if="loadingInit || loadingCheckDate || loadingGetData">
          <div class="cat">
            <div class="cat__body"></div>
            <div class="cat__body"></div>
            <div class="cat__tail"></div>
            <div class="cat__head"></div>
          </div>
        </div>
        <div key="1" v-else-if="!userData">
          <!--<el-alert
          :title="`系統正在改版，麻煩大家今天再輸入一次自己的暱稱`"
          type="error"
          :closable="false"
          class="isStyleBase mb-3"
        >
        </el-alert>-->
          <el-alert
            :title="`系統目前有${sheet.length}位使用者`"
            type="info"
            :closable="false"
            class="isStyleBase mb-5"
          >
          </el-alert>
          <el-input
            v-model="newUserName"
            placeholder="請輸入您的暱稱"
            class="mb-5"
          >
          </el-input>
          <el-button
            :loading="loadingNewUser"
            :disabled="!newUserName"
            type="primary"
            plain
            class="w-100"
            @click="newUser"
          >
            送出
          </el-button>
        </div>
        <div key="2" v-else-if="unUse.length === 0">
          <el-alert
            title="所有使用者皆以輸入，系統公開數字"
            type="info"
            :closable="false"
            class="mb-5"
          ></el-alert>
          <el-table
            :data="sheet"
            style="width: 100%"
            :default-sort = "{prop: 'diff', order: 'descending'}"
          >
            <el-table-column v-slot="{ row }" label="姓名" width="160">
              <img alt="" class="mr-3" width="25px" :src="`${row['頭像'] ? require(`@/assets/${row['頭像']}.png`) : require(`@/assets/正確答案.png`)}`">{{ row['名字'] }}
            </el-table-column>
            <el-table-column v-slot="{ row }" label="數字" :prop="today" sortable>
              {{ row[today] || 0 }}
            </el-table-column>
            <el-table-column v-slot="{ row }" label="差距" prop="diff" sortable>
              {{ Math.abs(row[today] - (sheet[0][today] || 0)) }}
            </el-table-column>
            <el-table-column v-slot="{ row }" label="🎖" prop="medals" width="90">
              {{ row['medals'] }}
              <template v-if="row.medalsStatus === 'get'">
                (+1)
              </template>
              <template v-if="row.medalsStatus === 'lose'">
                (-1)
              </template>
            </el-table-column>
            <el-table-column v-slot="{ row }" label="💸" prop="dead" width="160">
              [{{row['dead']}}] {{ row['dead'] * 150 }}
              <template v-if="row.deadStatus === 'get'">
                (+150)
              </template>
            </el-table-column>

          </el-table>
        </div>
        <div key="3" v-else>
          <div class="text-center">
            <div style="margin-bottom: 2rem">
              <div class="avatar">
                <div
                  class="avatar__img"
                >
                  <div
                    class="avatar__imgInner"
                    :style="userData['頭像'] ? `backgroundImage: url('${require(`@/assets/${userData['頭像']}.png`)}')` : ''"
                  >

                  </div>
                </div>
              </div>
              <div style="font-size: 2rem;margin-top: 2rem;font-weight: 500">Hi, {{ userData['名字'] }}</div>
            </div>
            <template v-if="userData[today]">
              <div class="text-center">
                這是你今天輸入的數字
                <div style="font-size: 170px;font-weight: 900;">{{ userData[today] }}</div>
              </div>
              <el-alert
                :title="`好像還有人沒猜數字喔`"
                type="error"
                :closable="false"
                class="mb-5 isStyleBase"
              ></el-alert>
              <template v-for="unUseItem in unUse">
                <div
                  v-if="unUseItem['名字'] !== userData['名字']"
                  class="avatar isSmall"
                >
                  <div
                    class="avatar__img"
                  >
                    <div
                      class="avatar__imgInner"
                      :style="unUseItem['頭像'] ? `backgroundImage: url('${require(`@/assets/${unUseItem['頭像']}.png`)}')` : ''"
                    >

                    </div>
                  </div>
                </div>
              </template>
            </template>
            <template v-else>
              <el-input
                v-model="newNumber"
                placeholder="請輸入今天的數字"
                class="isStyleBase mb-5"
              >
              </el-input>
              <el-button
                :loading="loadingSetNewNumber"
                :disabled="!newNumber"
                type="primary"
                plain
                class="w-100 mb-5"
                @click="setNewNumber"
              >
                送出
              </el-button>
            </template>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>
<style lang="scss" module>
.home {
  :global {
    .home {
      &__loading {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
      }
    }
    .avatar {
      width: 100px;
      margin: 0 auto;
      position: relative;
      &:before {
        content: '';
        position: absolute;
        left: -5px;
        right: -5px;
        top: -5px;
        bottom: -5px;
        transition: left 0.3s, right 0.3s, top 0.3s, bottom 0.3s, opacity 0.3s;
        border: 1px solid;
        opacity: 0.5;
        transform: rotate(45deg);
      }
      &.isSmall {
        width: 50px;
        display: inline-block;
        margin: 0 10px;
        .avatar {
          &__img {
            width: 50px;
            padding: 50px 0 0 0;
          }
          &__imgInner {
            background-size: 70px;
            background-position: center 70px;
          }
        }
      }
      .avatar {
        &__img {
          width: 100px;
          padding: 100px 0 0 0;
          transform: rotate(45deg);
          position: relative;
          background: transparent;
          border: 1px solid;
          overflow: hidden;
          background-position: center;
          background-size: cover;
        }
        &__imgInner {
          left: 0;
          top: 0;
          width: 140px;
          height: 140px;
          margin-top: -20px;
          margin-left: -20px;
          transform: rotate(-45deg);
          position: absolute;
          background-size: cover;
          background-position: center;
        }
      }
    }

    @mixin fill-full($dir: 'full', $type: absolute) {
      position: $type;
      @if $dir != 'bottom' {top: 0; }
      @if $dir != 'right' {left: 0; }
      @if $dir != 'left' {right: 0; }
      @if $dir != 'top' {bottom: 0; }
    }

    .cat {
      position: relative;
      width: 100%;
      &::before {
        content: '';
        display: block;
        padding-bottom: 100%;
      }

      &:hover > * { animation-play-state: paused; }
      &:active > * { animation-play-state: running; }
    }

    %cat-img {
      @include fill-full;
      animation: rotatinga 8.37s cubic-bezier(.65, .54, .12, .93) infinite;

      &::before {
        content: '';
        position: absolute;
        width: 50%;
        height: 50%;
        background-size: 200%;
        background-repeat: no-repeat;
        background-image: url('https://images.weserv.nl/?url=i.imgur.com/M1raXX3.png&il');
      }
    }

    .cat__head {
      @extend %cat-img;

      &::before {
        top: 0;
        right: 0;
        background-position: 100% 0%;
        transform-origin: 0% 100%;
        transform: rotate(90deg);
      }
    }

    .cat__tail {
      @extend %cat-img;
      // animation-delay: .2s;

      &::before {
        left: 0;
        bottom: 0;
        background-position: 0% 100%;
        transform-origin: 100% 0%;
        transform: rotate(-30deg);
      }
    }

    .cat__body {
      @extend %cat-img;
      // animation-delay: .1s;


      &:nth-of-type(2) {
        // animation-delay: .2s;
      }

      &::before {
        right: 0;
        bottom: 0;
        background-position: 100% 100%;
        transform-origin: 0% 0%;
      }
    }

    .box {
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: flex-start;
      justify-content: center;
      align-items: center;
      margin: 25vh auto;
      width: 200px;
      height: 200px;
      position: relative;
      background-color: #e6dcdc;
      overflow: hidden;
      overflow: hidden;
      border-radius: 100%;
      padding: 30px;
    }
  }
}

</style>
<style lang="scss">
  @keyframes rotatinga {
    from {
      transform: rotate(2160deg);
    }
    to {
      transform: none;
    }
  }
</style>
